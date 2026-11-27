// Avisos de MiCine. GET → clave pública para suscribirse. POST (con x-cron-secret) → revisa y envía:
//  · estrenos de actores que cada usuario sigue
//  · estrenos de sagas de las que vio alguna película
//  · recordatorio de los viernes con una peli de sus géneros favoritos
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const CRON = Deno.env.get("CRON_SECRET") ?? "";
const TMDB = (Deno.env.get("TMDB_API_KEY") ?? "").trim();
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-cron-secret", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
const json = (s: number, d: unknown) => new Response(JSON.stringify(d), { status: s, headers: { ...CORS, "content-type": "application/json" } });

if (VAPID_PUBLIC && VAPID_PRIVATE) webpush.setVapidDetails("mailto:micine@users.noreply.github.com", VAPID_PUBLIC, VAPID_PRIVATE);

const tcache = new Map<string, any>();
async function tmdb(path: string, params: Record<string, string> = {}) {
  const q = new URLSearchParams({ language: "es-MX", ...params });
  const key = path + "?" + q;
  if (tcache.has(key)) return tcache.get(key);
  const h: Record<string, string> = { accept: "application/json" };
  if (/^[a-f0-9]{32}$/i.test(TMDB)) q.set("api_key", TMDB); else h.Authorization = "Bearer " + TMDB;
  const r = await fetch(`https://api.themoviedb.org/3/${path}?${q}`, { headers: h });
  const d = r.ok ? await r.json() : null;
  tcache.set(key, d);
  return d;
}
const dstr = (d: Date) => d.toISOString().slice(0, 10);

type Note = { key: string; title: string; body: string; url: string; image?: string };

async function run(dry: boolean) {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const ar = new Date(Date.now() - 3 * 3600_000); // hora de Argentina
  const today = dstr(ar), from = dstr(new Date(ar.getTime() - 2 * 86400_000));
  const isFriday = ar.getUTCDay() === 5;
  const { data: subs, error } = await sb.from("push_subs").select("*");
  if (error) throw error;
  const byUser = new Map<string, any[]>();
  for (const s of subs ?? []) byUser.set(s.user_id, [...(byUser.get(s.user_id) ?? []), s]);
  const gl = (await tmdb("genre/movie/list"))?.genres ?? [];
  const out = { users: byUser.size, sent: 0, removed: 0, skipped: 0, errors: 0, today, isFriday };

  for (const [uid, list] of byUser) {
    const prefs = { estrenos: true, recordatorios: true, ...(list[0].prefs ?? {}) };
    const [{ data: lib }, { data: fol }, { data: prof }] = await Promise.all([
      sb.from("library").select("media_key,tmdb_id,media_type,status,genres,created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(2000),
      sb.from("followed_people").select("person_id,name").eq("user_id", uid),
      sb.from("profiles").select("fav_genres").eq("id", uid).maybeSingle(),
    ]);
    const seen = new Set((lib ?? []).filter((x) => x.status === "watched").map((x) => x.media_key));
    const notes: Note[] = [];
    if (prefs.estrenos) {
      for (const f of (fol ?? []).slice(0, 20)) {
        const cr = await tmdb(`person/${f.person_id}/combined_credits`);
        for (const c of cr?.cast ?? []) {
          const date = c.release_date || c.first_air_date || "";
          const type = c.media_type;
          if (!date || date < from || date > today || (type !== "movie" && type !== "tv")) continue;
          if (seen.has(`${type}:${c.id}`)) continue;
          notes.push({ key: `estreno:${type}:${c.id}`, title: `🎬 Estreno con ${f.name}`, body: `${c.title || c.name} ya está disponible. Fijate dónde verla en MiCine.`, url: `./#t-${type}-${c.id}`, image: c.backdrop_path ? `https://image.tmdb.org/t/p/w780${c.backdrop_path}` : undefined });
        }
      }
      const movies = (lib ?? []).filter((x) => x.status === "watched" && x.media_type === "movie").slice(0, 40);
      const cols = new Set<number>();
      for (const m of movies) { const d = await tmdb(`movie/${m.tmdb_id}`); if (d?.belongs_to_collection?.id) cols.add(d.belongs_to_collection.id); }
      for (const cid of cols) {
        const col = await tmdb(`collection/${cid}`);
        for (const p of col?.parts ?? []) {
          if (!p.release_date || p.release_date < from || p.release_date > today || seen.has(`movie:${p.id}`)) continue;
          notes.push({ key: `estreno:movie:${p.id}`, title: `🍿 Nueva película de ${col.name}`, body: `Se estrenó ${p.title}. ¿Seguís la saga?`, url: `./#t-movie-${p.id}`, image: p.backdrop_path ? `https://image.tmdb.org/t/p/w780${p.backdrop_path}` : undefined });
        }
      }
    }
    if (prefs.recordatorios && isFriday) {
      const fav: number[] = prof?.fav_genres ?? [];
      const counts = new Map<number, number>();
      for (const x of lib ?? []) for (const g of x.genres ?? []) counts.set(g, (counts.get(g) ?? 0) + 1);
      const pool = fav.length ? fav : [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]);
      const g = pool.length ? pool[Math.floor(Math.random() * pool.length)] : 878;
      const gname = (gl.find((x: any) => x.id === g)?.name ?? "cine").toLowerCase();
      const disc = await tmdb("discover/movie", { with_genres: String(g), sort_by: "popularity.desc", "vote_count.gte": "500", page: String(1 + Math.floor(Math.random() * 3)) });
      const pick = (disc?.results ?? []).find((r: any) => !seen.has(`movie:${r.id}`));
      notes.push(pick
        ? { key: `viernes:${today}`, title: "🍿 ¡Viernes de cine!", body: `Hoy pinta una de ${gname}. ¿Qué tal "${pick.title}"?`, url: `./#t-movie-${pick.id}`, image: pick.backdrop_path ? `https://image.tmdb.org/t/p/w780${pick.backdrop_path}` : undefined }
        : { key: `viernes:${today}`, title: "🍿 ¡Viernes de cine!", body: `Hoy pinta una de ${gname}. Girá la ruleta y que decida la suerte.`, url: "./#ruleta" });
    }
    if (!notes.length) continue;
    const uniq = [...new Map(notes.map((n) => [n.key, n])).values()];
    const { data: done } = await sb.from("push_log").select("key").eq("user_id", uid).in("key", uniq.map((n) => n.key));
    const already = new Set((done ?? []).map((d) => d.key));
    const toSend = uniq.filter((n) => !already.has(n.key)).slice(0, 2); // máximo 2 avisos por día
    out.skipped += uniq.length - toSend.length;
    for (const n of toSend) {
      if (!dry) {
        for (const s of list) {
          try {
            await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ title: n.title, body: n.body, url: n.url, image: n.image, tag: n.key }), { TTL: 86400 });
          } catch (e: any) {
            if (e?.statusCode === 404 || e?.statusCode === 410) { await sb.from("push_subs").delete().eq("endpoint", s.endpoint); out.removed++; }
            else { out.errors++; console.error(e?.statusCode, e?.body ?? e); }
          }
        }
        await sb.from("push_log").insert({ user_id: uid, key: n.key });
      }
      out.sent++;
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method === "GET") return json(200, { vapid: VAPID_PUBLIC });
  if (req.method !== "POST") return json(405, { error: "método no permitido" });
  if (!CRON || req.headers.get("x-cron-secret") !== CRON) return json(401, { error: "no autorizado" });
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return json(500, { error: "faltan las claves VAPID" });
  let body: any = {};
  try { body = await req.json(); } catch (_) { /* sin cuerpo */ }
  try { return json(200, await run(!!body.dry)); } catch (e: any) { console.error(e); return json(500, { error: String(e?.message ?? e) }); }
});
