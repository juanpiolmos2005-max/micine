// Servidor intermedio de MiCine: guarda la clave de TMDB en secreto y reenvía
// solo consultas de lectura permitidas. Uso: GET /functions/v1/tmdb?path=movie/550&language=es-MX

const KEY = (Deno.env.get("TMDB_API_KEY") ?? "").trim();
const IS_V3 = /^[a-f0-9]{32}$/i.test(KEY);
const ALLOWED = /^(movie|tv|person|search|trending|discover|genre|collection|configuration|watch)(\/[a-z0-9_\/-]*)?$/i;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const cache = new Map<string, { t: number; body: string }>();
const MAX = 3000;

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "GET") return json(405, { error: "Solo GET" });
  if (!KEY) return json(500, { error: "Falta el secreto TMDB_API_KEY" });

  const url = new URL(req.url);
  const path = (url.searchParams.get("path") ?? "").replace(/^\/+/, "");
  if (!ALLOWED.test(path) || path.includes("..")) return json(400, { error: "Ruta no permitida" });

  const params = new URLSearchParams();
  [...url.searchParams.entries()]
    .filter(([k]) => k !== "path" && k !== "api_key")
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([k, v]) => params.append(k, v));

  const cacheKey = path + "?" + params.toString();
  const fast = /^(trending|movie\/now_playing|tv\/on_the_air|movie\/popular|tv\/popular|person\/popular)/.test(path);
  const ttl = (fast ? 1 : 24) * 3600_000;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.t < ttl) {
    return new Response(hit.body, {
      headers: { ...CORS, "content-type": "application/json", "cache-control": "public, max-age=3600", "x-cache": "hit" },
    });
  }

  const headers: Record<string, string> = { accept: "application/json" };
  if (IS_V3) params.set("api_key", KEY);
  else headers.Authorization = `Bearer ${KEY}`;

  let r: Response;
  try {
    r = await fetch(`https://api.themoviedb.org/3/${path}?${params}`, { headers });
  } catch (_) {
    return json(502, { error: "No se pudo contactar a TMDB" });
  }
  const body = await r.text();
  if (r.ok) {
    cache.set(cacheKey, { t: Date.now(), body });
    if (cache.size > MAX) cache.delete(cache.keys().next().value!);
  }
  return new Response(body, {
    status: r.status,
    headers: {
      ...CORS,
      "content-type": "application/json",
      "cache-control": r.ok ? "public, max-age=3600" : "no-store",
    },
  });
});
