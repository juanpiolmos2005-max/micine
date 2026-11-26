import { THEMES, icon } from './themes.js';
import { AVATARS, avatarSVG, SKINS, COLORS } from './avatars.js';
import { SAGAS } from './sagas.js';

/* =========================================================================
   MODO: "nube" (Supabase: cuentas + servidor TMDB) o "personal" (clave propia)
   ========================================================================= */
const CFG = window.MICINE_CONFIG || {};
const CLOUD = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
let sb = null;
if (CLOUD) {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    sb = createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
  } catch (e) { console.error(e); }
}

/* ===================== Estado local ===================== */
const LS = 'micine.v2';
const L = { key: '', region: 'AR', lang: 'es-MX', cache: {}, meta: {}, order: {}, series: {}, theme: 'cine', watched: {}, want: {}, follows: {}, profile: null };
try { Object.assign(L, JSON.parse(localStorage.getItem(LS) || 'null') || {}); } catch (e) {}
try {
  const v1 = JSON.parse(localStorage.getItem('micine.v1') || 'null');
  if (v1 && !L.migrated) {
    L.key = L.key || v1.key || '';
    Object.assign(L.watched, v1.watched || {}); Object.assign(L.want, v1.want || {});
    Object.assign(L.cache, v1.cache || {}); Object.assign(L.order, v1.order || {}); Object.assign(L.series, v1.series || {});
    L.region = v1.region || L.region; L.lang = v1.lang || L.lang;
  }
} catch (e) {}
L.migrated = 1; L.meta = L.meta || {};
const saveL = () => { try { localStorage.setItem(LS, JSON.stringify(L)); } catch (e) { L.meta = {}; try { localStorage.setItem(LS, JSON.stringify(L)); } catch (e2) {} } };
saveL();

let user = null;
const D = { watched: {}, want: {}, follows: {}, profile: null, cloudEmpty: false, conns: [], cpl: {}, plib: {} };
function useLocal() { D.watched = L.watched; D.want = L.want; D.follows = L.follows; D.profile = L.profile; }

const REG = {};
const $ = s => document.querySelector(s);
const app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const img = (p, sz = 'w342') => p ? `https://image.tmdb.org/t/p/${sz}${p}` : '';
const kOf = n => n.type + ':' + n.id;
const T = () => THEMES[curTheme()] || THEMES.cine;
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const dayOf = w => w.watched_on === null ? null : (w.watched_on || (w.at ? new Date(w.at - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10) : null));
const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const STAR = { d: 'M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z', fill: 1 };
const SEARCH = { d: 'M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13zM15.5 15.5 21 21' };
const DICE = { d: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 7h.01M16 7h.01M12 12h.01M8 17h.01M16 17h.01' };
const stars = (r, size = 13) => r ? `<span class="stars-s" aria-label="${r} de 5">${[1, 2, 3, 4, 5].map(i => `<span class="${i <= r ? 'on' : ''}">${icon(STAR, size)}</span>`).join('')}</span>` : '';
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
const spinner = (txt) => `<div class="spin">${icon(T().mark, 34)}${esc(txt || T().loading)}</div>`;
const emptyBox = (txt, extra = '') => `<div class="empty">${icon(T().mark, 40)}<p>${txt}</p>${extra}</div>`;
const pAvatar = (p, size = 36) => avatarSVG((p && p.avatar) || 'cinefilo', (p && p.color) || T().c.acc, (p && p.prefs && p.prefs.skin) || SKINS[0], size);
const pName = p => (p && (p.display_name || p.username)) || 'Alguien';

/* ===================== Temas ===================== */
function curTheme() { return (D.profile && D.profile.theme) || L.theme || 'cine'; }
function applyTheme(id) {
  const t = THEMES[id] || THEMES.cine, r = document.documentElement;
  r.dataset.theme = id;
  for (const [k, v] of Object.entries(t.c)) r.style.setProperty('--' + k, v);
  r.style.setProperty('--fh', t.font);
  r.style.setProperty('--pat', t.pattern);
  r.style.setProperty('--patsize', t.patternSize || 'auto');
  r.style.colorScheme = t.dark ? 'dark' : 'light';
  document.querySelector('meta[name=theme-color]').setAttribute('content', t.c.bg);
  $('#logoMark').innerHTML = icon(t.mark, 22);
}

/* ===================== TMDB y Wikidata ===================== */
async function api(path, params = {}, keyOverride) {
  const qs = new URLSearchParams({ language: L.lang });
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  let url, h = { accept: 'application/json' };
  if (CLOUD) { qs.set('path', path); url = `${CFG.supabaseUrl}/functions/v1/tmdb?${qs}`; }
  else {
    const key = (keyOverride ?? L.key).trim();
    if (!key) throw new Error('Falta la clave de TMDB.');
    if (/^[a-f0-9]{32}$/i.test(key)) qs.set('api_key', key); else h.Authorization = 'Bearer ' + key;
    url = `https://api.themoviedb.org/3/${path}?${qs}`;
  }
  let r = await fetch(url, { headers: h });
  if (CLOUD && r.status === 401) r = await fetch(url, { headers: { ...h, apikey: CFG.supabaseAnonKey, Authorization: 'Bearer ' + CFG.supabaseAnonKey } });
  if (r.status === 401) throw new Error(CLOUD ? 'El servidor no tiene una clave de TMDB válida.' : 'La clave de TMDB no es válida.');
  if (r.status === 429) throw new Error('Demasiadas consultas: probá de nuevo en unos segundos.');
  if (!r.ok) throw new Error('No se pudo consultar TMDB (error ' + r.status + ').');
  return r.json();
}
async function wd(params) {
  const u = new URL('https://www.wikidata.org/w/api.php');
  for (const [k, v] of Object.entries({ ...params, format: 'json', origin: '*' })) u.searchParams.set(k, v);
  const r = await fetch(u); if (!r.ok) throw new Error('wikidata'); return r.json();
}
function norm(r, type) {
  const t = r.media_type || type;
  const n = { id: r.id, type: t, title: r.title || r.name || 'Sin título', year: (r.release_date || r.first_air_date || '').slice(0, 4), poster: r.poster_path || null, vote: r.vote_average || 0 };
  if (r.genre_ids) n.g = r.genre_ids;
  if (r.backdrop_path) n.bd = r.backdrop_path;
  if (r.overview) n.ov = r.overview;
  const k = t + ':' + r.id; REG[k] = Object.assign(REG[k] || {}, n); return REG[k];
}
let genreCache = {};
async function genres(type) { if (!genreCache[type]) { try { genreCache[type] = (await api(`genre/${type}/list`)).genres; } catch (e) { return []; } } return genreCache[type]; }

/* ===================== Datos del usuario ===================== */
const needsAccount = () => CLOUD && !user;
function askAccount(msg) { toast(msg || 'Creá tu cuenta para guardar tu lista'); go('yo'); }
const libRec = r => ({ id: r.tmdb_id, type: r.media_type, title: r.title, poster: r.poster, year: r.year, vote: r.vote, at: Date.parse(r.created_at), rating: r.rating || null, review: r.review || '', watched_on: r.watched_on ?? null, g: r.genres || [] });

async function loadCloud() {
  const [p, lib, fol] = await Promise.all([
    sb.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    sb.from('library').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5000),
    sb.from('followed_people').select('*').eq('user_id', user.id),
  ]);
  D.profile = p.data || null;
  D.watched = {}; D.want = {}; D.follows = {};
  for (const r of lib.data || []) (r.status === 'watched' ? D.watched : D.want)[r.media_key] = libRec(r);
  for (const f of fol.data || []) D.follows[f.person_id] = { id: f.person_id, name: f.name, photo: f.profile_path, at: Date.parse(f.created_at) };
  D.cloudEmpty = !(lib.data || []).length;
  await loadConns();
}
async function loadConns() {
  if (!CLOUD || !user) return;
  const c = await sb.from('connections').select('*');
  if (c.error) { console.warn(c.error); D.conns = []; return; }
  const ids = [...new Set((c.data || []).map(x => x.requester === user.id ? x.addressee : x.requester))];
  const pr = ids.length ? await sb.from('profiles').select('*').in('id', ids) : { data: [] };
  const pm = Object.fromEntries((pr.data || []).map(x => [x.id, x]));
  D.conns = (c.data || []).map(x => { const oid = x.requester === user.id ? x.addressee : x.requester; return { id: x.id, status: x.status, incoming: x.addressee === user.id, otherId: oid, other: pm[oid] || { username: '?', display_name: 'Usuario' } }; });
  const acc = D.conns.filter(x => x.status === 'accepted').map(x => x.id);
  D.cpl = {};
  acc.forEach(id => D.cpl[id] = {});
  if (acc.length) {
    const ci = await sb.from('couple_items').select('*').in('connection_id', acc);
    for (const r of ci.data || []) D.cpl[r.connection_id][r.media_key] = { ...libRec(r), status: r.status, by: r.added_by };
  }
  renderBadge();
}
const accepted = () => D.conns.filter(c => c.status === 'accepted');
function cloudErr(r) { if (r && r.error) { console.error(r.error); toast('No se pudo guardar: revisá tu conexión'); } }

function setStatus(k, status, opts = {}) {
  const n = REG[k] || D.watched[k] || D.want[k];
  if (!n) return false;
  if (needsAccount()) { askAccount(); return false; }
  const prev = D.watched[k] || {};
  const rec = { id: n.id, type: n.type, title: n.title, year: n.year || '', poster: n.poster || null, vote: n.vote || 0, at: Date.now(), g: n.g || prev.g || [] };
  if (status === 'watched') Object.assign(rec, { rating: prev.rating || null, review: prev.review || '', watched_on: opts.watched_on !== undefined ? opts.watched_on : (prev.watched_on !== undefined && D.watched[k] ? prev.watched_on : today()) });
  delete D.watched[k]; delete D.want[k];
  if (status) D[status === 'watched' ? 'watched' : 'want'][k] = rec;
  if (CLOUD) {
    const row = { user_id: user.id, media_key: k, status, tmdb_id: rec.id, media_type: rec.type, title: rec.title, poster: rec.poster, year: rec.year, vote: rec.vote, genres: rec.g };
    if (status === 'watched') row.watched_on = rec.watched_on;
    const q = status ? sb.from('library').upsert(row) : sb.from('library').delete().eq('user_id', user.id).eq('media_key', k);
    q.then(cloudErr);
  } else saveL();
  recsCache = null; coupleRecs = {};
  return true;
}
function toggleWatched(k) {
  const was = !!D.watched[k];
  if (!setStatus(k, was ? null : 'watched')) return;
  toast(was ? 'Quitada de vistas' : `${REG[k]?.title || 'Marcada'}: ¡vista! Abrila para ponerle puntaje`);
  refresh();
}
function toggleWant(k) { if (setStatus(k, D.want[k] ? null : 'want')) refresh(); }
async function saveReview(k, data) {
  const w = D.watched[k]; if (!w) return;
  Object.assign(w, data);
  if (CLOUD) { const r = await sb.from('library').update({ rating: w.rating, review: w.review, watched_on: w.watched_on }).eq('user_id', user.id).eq('media_key', k); cloudErr(r); }
  else saveL();
  recsCache = null; coupleRecs = {};
}

function toggleFollow(p) {
  if (needsAccount()) return askAccount('Creá tu cuenta para seguir actores');
  const id = +p.id;
  if (D.follows[id]) {
    delete D.follows[id];
    if (CLOUD) sb.from('followed_people').delete().eq('user_id', user.id).eq('person_id', id).then(cloudErr);
    toast('Dejaste de seguir a ' + p.name);
  } else {
    D.follows[id] = { id, name: p.name, photo: p.photo || null, at: Date.now() };
    if (CLOUD) sb.from('followed_people').upsert({ user_id: user.id, person_id: id, name: p.name, profile_path: p.photo || null }).then(cloudErr);
    toast('Ahora seguís a ' + p.name);
  }
  if (!CLOUD) saveL();
  recsCache = null; coupleRecs = {};
  document.querySelectorAll(`[data-follow="${id}"]`).forEach(b => { const on = !!D.follows[id]; b.setAttribute('aria-pressed', on); b.textContent = on ? 'Siguiendo' : 'Seguir'; if (b.classList.contains('btn')) b.classList.toggle('on', on); });
}

async function toggleCouple(cid, k, status) {
  const n = REG[k] || D.watched[k] || D.want[k]; const list = D.cpl[cid]; if (!n || !list) return;
  const cur = list[k];
  if (cur && cur.status === status) {
    delete list[k];
    cloudErr(await sb.from('couple_items').delete().eq('connection_id', cid).eq('media_key', k));
    toast('Quitada de la lista en común');
  } else {
    const row = { connection_id: cid, media_key: k, status, tmdb_id: n.id, media_type: n.type, title: n.title, poster: n.poster || null, year: n.year || '', vote: n.vote || 0, watched_on: status === 'watched' ? today() : null };
    list[k] = { ...n, status, at: Date.now(), by: user.id, watched_on: row.watched_on };
    cloudErr(await sb.from('couple_items').upsert(row));
    toast(status === 'watched' ? '¡Agregada a “vimos juntos”!' : 'Agregada a “queremos ver”');
  }
  coupleRecs = {};
  if (openKey) openDetail(openKey, true);
  if (view === 'juntos') render();
}

async function saveProfile(p) {
  if (CLOUD) {
    const r = await sb.from('profiles').upsert({ id: user.id, ...p });
    if (r.error) {
      if (r.error.code === '23505') throw new Error('Ese nombre de usuario ya existe. Probá con otro.');
      throw new Error('No se pudo guardar el perfil: ' + r.error.message);
    }
    D.profile = { ...(D.profile || {}), ...p };
  } else { L.profile = { ...(L.profile || {}), ...p }; D.profile = L.profile; }
  L.theme = p.theme; saveL();
}

async function importLocal() {
  const rows = [];
  for (const [k, v] of Object.entries(L.watched)) rows.push([k, 'watched', v]);
  for (const [k, v] of Object.entries(L.want)) if (!L.watched[k]) rows.push([k, 'want', v]);
  const data = rows.filter(([k]) => /^(movie|tv):\d+$/.test(k)).map(([k, s, v]) => ({ user_id: user.id, media_key: k, status: s, tmdb_id: v.id, media_type: v.type, title: v.title || 'Sin título', poster: v.poster || null, year: v.year || '', vote: v.vote || 0, rating: v.rating || null, review: v.review || null, watched_on: s === 'watched' ? (v.watched_on ?? dayOf(v)) : null }));
  for (let i = 0; i < data.length; i += 500) { const r = await sb.from('library').upsert(data.slice(i, i + 500)); if (r.error) throw r.error; }
  await loadCloud(); recsCache = null;
  toast(`Importé ${data.length} títulos a tu cuenta`);
}

/* ===================== Componentes ===================== */
function card(n, extra = '') {
  const k = kOf(n); REG[k] = Object.assign(REG[k] || {}, n);
  const w = D.watched[k], t = T();
  return `<article class="card${w ? ' seen' : ''}" data-k="${k}">
  <button class="poster" data-open="${k}" aria-label="${esc(n.title)}">${n.poster ? `<img loading="lazy" src="${img(n.poster)}" alt="">` : `<span>${esc(n.title)}</span>`}</button>
  ${D.want[k] && !w ? `<span class="wantmark" title="Quiero ver">${icon(t.want, 16)}</span>` : ''}
  <button class="tick" data-tick="${k}" aria-pressed="${!!w}" aria-label="${w ? 'Vista. Tocá para desmarcar' : 'Marcar como vista'}">${icon(t.mark, 20)}</button>
  <div class="meta"><b>${esc(n.title)}</b><small>${n.year || '—'} · ${n.type === 'tv' ? 'Serie' : 'Película'}${n.vote ? ` · ★ ${(+n.vote).toFixed(1)}` : ''}</small>${w && w.rating ? stars(w.rating) : ''}${extra}</div></article>`;
}
function personCard(p, sub = '') {
  const on = !!D.follows[p.id];
  return `<div class="person"><button class="face" data-person="${p.id}" aria-label="${esc(p.name)}">${p.photo ? `<img loading="lazy" src="${img(p.photo, 'w185')}" alt="">` : `<span>${esc(p.name.slice(0, 1))}</span>`}</button>
  <b>${esc(p.name)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}
  <button class="follow" data-follow="${p.id}" data-name="${esc(p.name)}" data-photo="${esc(p.photo || '')}" aria-pressed="${on}">${on ? 'Siguiendo' : 'Seguir'}</button></div>`;
}
const myAvatar = (size = 36) => pAvatar(D.profile, size);
const searchTabs = a => `<nav class="seg stabs" aria-label="Qué buscar">${[['explorar', 'Títulos'], ['actores', 'Actores'], ['personajes', 'Personajes']].map(([h, l]) => `<a href="#${h}"${a === h ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;

/* ===================== Navegación ===================== */
const NAV = [
  ['explorar', 'Explorar', { d: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM15.5 8.5l-2 5-5 2 2-5z' }],
  ['sagas', 'Sagas', { d: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5' }],
  ['parati', 'Para vos', null],
  ['juntos', 'Juntos', { d: 'M8 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 1 0 0 7zM16 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 1 0 0 7zM2 20c0-3.3 2.7-5.5 6-5.5 1.6 0 3 .5 4 1.4 1-.9 2.4-1.4 4-1.4 3.3 0 6 2.2 6 5.5' }],
];
function renderShell() {
  const ic = it => icon(it[2] || T().mark, 22);
  const hasUser = !!D.profile && (!CLOUD || user);
  const item = it => `<a href="#${it[0]}" data-nav="${it[0]}">${ic(it)}${it[1]}${it[0] === 'juntos' ? '<b class="badge" hidden></b>' : ''}</a>`;
  $('#navTop').innerHTML = NAV.map(item).join('');
  $('#tabbar').innerHTML = NAV.map(item).join('') +
    `<a href="#yo" data-nav="yo">${hasUser ? myAvatar(26) : icon({ d: 'M12 12a4.5 4.5 0 1 0 0-9a4.5 4.5 0 1 0 0 9zM3.5 21c0-4.5 3.8-7 8.5-7s8.5 2.5 8.5 7' }, 22)}${hasUser ? 'Yo' : (CLOUD ? 'Entrar' : 'Perfil')}</a>`;
  const me = $('#meBtn');
  me.classList.toggle('guest', !hasUser);
  me.innerHTML = hasUser ? `<span>${esc(pName(D.profile))}</span>${myAvatar(36)}` : (CLOUD ? 'Entrar' : 'Crear personaje');
  $('#logoMark').innerHTML = icon(T().mark, 22);
  renderBadge(); markNav();
}
function renderBadge() {
  const n = D.conns.filter(c => c.status === 'pending' && c.incoming).length;
  document.querySelectorAll('.badge').forEach(b => { b.hidden = !n; b.textContent = n; });
}
function markNav() {
  const v = { actor: 'explorar', actores: 'explorar', personajes: 'explorar', editar: 'yo', resumen: 'yo', ruleta: arg ? 'juntos' : 'parati', perfil: 'juntos' }[view] || view;
  document.querySelectorAll('[data-nav]').forEach(a => a.dataset.nav === v ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
}
let view = 'explorar', arg = null;
const go = h => { if (location.hash.slice(1) === h) route(); else location.hash = h; };
function route() {
  const h = decodeURIComponent(location.hash.slice(1));
  arg = null;
  const pre = [['saga-', 'sagas'], ['actor-', 'actor'], ['juntos-', 'juntos'], ['u-', 'perfil'], ['ruleta-', 'ruleta']].find(([p]) => h.startsWith(p));
  if (pre) { view = pre[1]; arg = h.slice(pre[0].length); if (view === 'actor') arg = +arg; }
  else view = ['explorar', 'sagas', 'parati', 'actores', 'personajes', 'juntos', 'ruleta', 'resumen', 'yo', 'editar', 'nueva-clave'].includes(h) ? h : 'explorar';
  if (view !== 'editar') applyTheme(curTheme());
  markNav();
  render();
}
function render() {
  if (!CLOUD && !L.key && view !== 'editar') return renderHello();
  if (CLOUD && user && !D.profile && view !== 'editar' && view !== 'nueva-clave') { location.replace('#editar'); return; }
  ({ explorar: renderExplore, sagas: renderSagas, parati: renderRecs, actores: renderPeople, personajes: renderCharacters, actor: renderActor, juntos: renderJuntos, perfil: renderUser, ruleta: renderRoulette, resumen: renderSummary, yo: renderMe, editar: renderEditor, 'nueva-clave': renderNewPass })[view]();
}
function refresh() {
  if (['explorar', 'parati', 'actor', 'personajes', 'perfil', 'ruleta'].includes(view)) {
    document.querySelectorAll('.card[data-k]').forEach(el => {
      const k = el.dataset.k, w = !!D.watched[k];
      el.classList.toggle('seen', w);
      const tk = el.querySelector('.tick'); if (tk) tk.setAttribute('aria-pressed', w);
      const wm = el.querySelector('.wantmark');
      if (w || !D.want[k]) { if (wm) wm.remove(); } else if (!wm) el.querySelector('.poster').insertAdjacentHTML('afterend', `<span class="wantmark">${icon(T().want, 16)}</span>`);
    });
    if (view === 'explorar' && ex.hide) renderExploreList();
  } else render();
  if (openKey) openDetail(openKey, true);
}

/* ===================== Bienvenida (modo personal sin clave) ===================== */
function renderHello() {
  const crowd = ['mago', 'astronauta', 'detective', 'alien', 'guerrera', 'robot', 'pirata', 'cinefilo'];
  app.innerHTML = `<section class="hello"><div>
   <h1>Todo lo que viste, en un solo lugar.</h1>
   <p class="muted">MiCine usa TMDB, la base abierta con prácticamente todas las películas y series del mundo. En modo personal necesitás una clave gratuita:</p>
   <ol><li>Creá una cuenta en <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener">themoviedb.org</a>.</li>
   <li>Pedí una clave en <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener">Ajustes → API</a> (uso personal).</li>
   <li>Pegá la <b>API Key</b> acá abajo.</li></ol>
   <form class="box" id="keyform"><label class="field"><span>Tu clave de TMDB</span><input id="keyin" autocomplete="off" placeholder="Pegá tu API Key o token"></label>
    <button class="btn">Conectar</button> <span class="err" id="keyerr"></span></form>
  </div><div class="crowd" aria-hidden="true">${crowd.map((a, i) => avatarSVG(a, COLORS[i % COLORS.length], SKINS[i % 4], 120)).join('')}</div></section>`;
  $('#keyform').onsubmit = async e => {
    e.preventDefault(); const k = $('#keyin').value.trim(); if (!k) return;
    $('#keyerr').textContent = 'Probando…';
    try { await api('configuration', {}, k); L.key = k; saveL(); toast('¡Conectado!'); go(L.profile ? 'explorar' : 'editar'); }
    catch (er) { $('#keyerr').textContent = er.message; }
  };
}

/* ===================== Explorar ===================== */
const ex = { type: 'movie', mode: 'trending', genre: null, q: '', page: 1, items: [], total: 1, hide: false, loading: false, err: '' };
async function fetchExplore(reset) {
  if (reset) { ex.page = 1; ex.items = []; }
  ex.loading = true; renderExploreList();
  try {
    let d;
    if (ex.q) d = await api(`search/${ex.type}`, { query: ex.q, page: ex.page });
    else if (ex.genre) d = await api(`discover/${ex.type}`, { with_genres: ex.genre, sort_by: 'popularity.desc', 'vote_count.gte': 50, page: ex.page });
    else if (ex.mode === 'top') d = await api(`${ex.type}/top_rated`, { page: ex.page });
    else if (ex.mode === 'popular') d = await api(`${ex.type}/popular`, { page: ex.page });
    else if (ex.mode === 'now') d = await api(ex.type === 'tv' ? 'tv/on_the_air' : 'movie/now_playing', { page: ex.page, region: L.region });
    else d = await api(`trending/${ex.type}/week`, { page: ex.page });
    const seen = new Set(ex.items.map(kOf));
    ex.items.push(...d.results.map(r => norm(r, ex.type)).filter(n => !seen.has(kOf(n))));
    ex.total = d.total_pages || 1; ex.err = '';
  } catch (e) { ex.err = e.message; }
  ex.loading = false; renderExploreList();
}
async function renderExplore() {
  const p = D.profile;
  app.innerHTML = `${CLOUD && !user ? `<div class="banner"><span><b>Creá tu personaje</b> para guardar lo que viste, puntuar, seguir actores y armar listas en pareja.</span><a class="btn small" href="#yo">Crear cuenta</a></div>` : ''}
  <h2 class="sec">${p ? `Hola, ${esc(pName(p))}` : 'Explorar'}</h2>
  ${searchTabs('explorar')}
  <form class="tools" id="sform" role="search"><div class="search">${icon(SEARCH, 20)}<input id="q" type="search" enterkeyhint="search" placeholder="Buscar cualquier película o serie…" value="${esc(ex.q)}" aria-label="Buscar"></div>
  <div class="ctrlrow"><div class="seg" id="tseg"><button type="button" data-t="movie">Películas</button><button type="button" data-t="tv">Series</button></div>
  <label class="chk"><input type="checkbox" id="hide"> Ocultar vistas</label></div></form>
  <div class="chips chipsrow"><div class="chipset" id="modes"></div><span class="chipsep" aria-hidden="true"></span><div class="chipset" id="gchips"></div></div><div id="exres" style="margin-top:16px"></div>`;
  $('#sform').onsubmit = e => { e.preventDefault(); ex.q = $('#q').value.trim(); ex.genre = null; $('#q').blur(); fetchExplore(true); };
  $('#q').oninput = e => { if (!e.target.value && ex.q) { ex.q = ''; fetchExplore(true); } };
  $('#tseg').onclick = e => { const t = e.target.dataset.t; if (!t || t === ex.type) return; ex.type = t; ex.genre = null; renderChips(); fetchExplore(true); };
  $('#hide').onchange = e => { ex.hide = e.target.checked; renderExploreList(); };
  $('#modes').onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.clear !== undefined) { ex.q = ''; $('#q').value = ''; } else { ex.mode = b.dataset.mode; ex.genre = null; } fetchExplore(true); };
  $('#gchips').onclick = e => { const b = e.target.closest('button'); if (!b) return; ex.genre = ex.genre == b.dataset.genre ? null : +b.dataset.genre; fetchExplore(true); };
  $('#hide').checked = ex.hide;
  renderChips();
  if (!ex.items.length && !ex.loading) fetchExplore(true); else renderExploreList();
}
async function renderChips() {
  document.querySelectorAll('#tseg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === ex.type));
  const modes = [['trending', 'Tendencias'], ['popular', 'Populares'], ['top', 'Mejor puntuadas'], ['now', ex.type === 'tv' ? 'En emisión' : 'En cines']];
  if (!$('#modes')) return;
  $('#modes').innerHTML = ex.q ? `<button aria-pressed="true" data-clear>Resultados para “${esc(ex.q)}” ✕</button>` : modes.map(m => `<button data-mode="${m[0]}" aria-pressed="${!ex.genre && ex.mode === m[0]}">${m[1]}</button>`).join('');
  const g = ex.q ? [] : await genres(ex.type);
  if ($('#gchips')) $('#gchips').innerHTML = g.map(x => `<button data-genre="${x.id}" aria-pressed="${ex.genre == x.id}">${esc(x.name)}</button>`).join('');
}
function renderExploreList() {
  const box = $('#exres'); if (!box) return;
  renderChips();
  const list = ex.hide ? ex.items.filter(n => !D.watched[kOf(n)]) : ex.items;
  box.innerHTML = (ex.err ? `<p class="err">${esc(ex.err)}</p>` : '') +
    (list.length ? `<div class="grid">${list.map(n => card(n)).join('')}</div>` : (ex.loading ? '' : emptyBox(ex.q ? 'No encontré nada con esa búsqueda.' : T().empty))) +
    (ex.loading ? spinner() : (ex.page < ex.total && ex.items.length ? '<button class="btn ghost more" id="more">Cargar más</button>' : ''));
  const m = $('#more'); if (m) m.onclick = () => { ex.page++; fetchExplore(false); };
}

/* ===================== Personajes: ¿quién hace de…? ===================== */
const ch = { q: '', res: null, loading: false, err: '' };
async function findCharacter(q) {
  const nq = fold(q).split(/\s+/).filter(Boolean);
  const matches = s => { const f = fold(s); return nq.every(w => f.includes(w)); };
  const people = {};
  const add = (p, role) => {
    const e = people[p.id] || (people[p.id] = { id: p.id, name: p.name, photo: p.photo, roles: [], score: 0 });
    if (!e.photo && p.photo) e.photo = p.photo;
    if (!e.roles.some(r => r.title === role.title && r.character === role.character)) e.roles.push(role);
    e.score += role.w || 1;
  };
  const tmdbPart = (async () => {
    const s = await api('search/multi', { query: q });
    const works = s.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 6);
    await Promise.all(works.map(async (w, i) => {
      try {
        const n = norm(w, w.media_type);
        const cr = await api(w.media_type === 'movie' ? `movie/${w.id}/credits` : `tv/${w.id}/aggregate_credits`);
        for (const c of cr.cast || []) {
          const chars = c.character || (c.roles || []).map(r => r.character).join(' / ');
          if (chars && matches(chars)) add({ id: c.id, name: c.name, photo: c.profile_path }, { character: chars, title: n.title, year: n.year, k: kOf(n), w: 3 - i * 0.3 });
        }
      } catch (e) {}
    }));
  })();
  const wdPart = (async () => {
    try {
      const sr = await Promise.all(['es', 'en'].map(l => wd({ action: 'wbsearchentities', search: q, language: l, uselang: 'es', type: 'item', limit: 8 })));
      const ids = [...new Set(sr.flatMap(x => (x.search || []).map(s => s.id)))].slice(0, 14);
      if (!ids.length) return;
      const lab = it => it.labels?.es?.value || it.labels?.en?.value || '';
      const des = it => it.descriptions?.es?.value || it.descriptions?.en?.value || '';
      const e = await wd({ action: 'wbgetentities', ids: ids.join('|'), props: 'claims|labels|descriptions', languages: 'es|en' });
      const chars = []; const perf = new Set();
      for (const id of ids) {
        const it = e.entities?.[id]; if (!it) continue;
        const p = (it.claims?.P175 || []).map(c => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
        if (p.length && matches(lab(it)) && !/\b(single|song|canci[oó]n|[aá]lbum|album|videojuego|video game)\b/i.test(des(it))) { chars.push({ label: lab(it), desc: des(it), p }); p.forEach(x => perf.add(x)); }
      }
      if (!chars.length) return;
      const pe = await wd({ action: 'wbgetentities', ids: [...perf].slice(0, 45).join('|'), props: 'claims|labels', languages: 'es|en' });
      const jobs = [];
      for (const c of chars) for (const pid of c.p) {
        const it = pe.entities?.[pid]; const tm = it?.claims?.P4985?.[0]?.mainsnak?.datavalue?.value;
        if (tm && jobs.length < 10) jobs.push({ tm: +tm, name: lab(it), c });
      }
      await Promise.all(jobs.map(async j => {
        let photo = null, name = j.name;
        try { const p = await api('person/' + j.tm); photo = p.profile_path; name = p.name || name; } catch (e) {}
        add({ id: j.tm, name, photo }, { character: j.c.label, title: j.c.desc, w: 2.5 });
      }));
    } catch (e) { console.warn('wikidata', e); }
  })();
  await Promise.all([tmdbPart, wdPart]);
  return Object.values(people).sort((a, b) => b.score - a.score).slice(0, 18);
}
async function renderCharacters() {
  app.innerHTML = `<h2 class="sec">Personajes</h2>${searchTabs('personajes')}
  <p class="muted">¿Quién hace de…? Escribí el nombre de un personaje y te digo qué actor o actriz lo interpreta.</p>
  <form class="tools" id="chf" role="search"><div class="search">${icon(SEARCH, 20)}<input id="chq" type="search" enterkeyhint="search" placeholder="Ej: Thor, Jack Sparrow, Hermione, Walter White…" value="${esc(ch.q)}" aria-label="Personaje"></div><button class="btn">Buscar</button></form>
  <div id="chres"></div>`;
  $('#chf').onsubmit = async e => {
    e.preventDefault(); const q = $('#chq').value.trim(); if (q.length < 2) return; $('#chq').blur();
    ch.q = q; ch.res = null; ch.loading = true; drawCh();
    try { ch.res = await findCharacter(q); ch.err = ''; } catch (er) { ch.err = er.message; }
    ch.loading = false; if (view === 'personajes') drawCh();
  };
  drawCh();
}
function drawCh() {
  const box = $('#chres'); if (!box) return;
  if (ch.loading) { box.innerHTML = spinner('Buscando en los repartos…'); return; }
  if (ch.err) { box.innerHTML = `<p class="err">${esc(ch.err)}</p>`; return; }
  if (!ch.res) { box.innerHTML = emptyBox('Probá con un personaje: “Thor”, “Jack Sparrow”, “Hermione Granger”.'); return; }
  if (!ch.res.length) { box.innerHTML = emptyBox(`No encontré a nadie que interprete a “${esc(ch.q)}”. Probá con el nombre completo del personaje.`); return; }
  box.innerHTML = `<div class="roles">${ch.res.map(p => `<article class="role"><button class="face" data-person="${p.id}" aria-label="${esc(p.name)}">${p.photo ? `<img loading="lazy" src="${img(p.photo, 'w185')}" alt="">` : `<span>${esc(p.name.slice(0, 1))}</span>`}</button>
   <div><b><a href="#actor-${p.id}">${esc(p.name)}</a></b>${p.roles.slice(0, 3).map(r => `<p>es <b>${esc(r.character)}</b>${r.title ? ` en ${r.k ? `<a href="#" data-open="${r.k}">${esc(r.title)}</a>` : esc(r.title)}${r.year ? ` (${r.year})` : ''}` : ''}</p>`).join('')}
   <button class="follow" data-follow="${p.id}" data-name="${esc(p.name)}" data-photo="${esc(p.photo || '')}" aria-pressed="${!!D.follows[p.id]}">${D.follows[p.id] ? 'Siguiendo' : 'Seguir'}</button></div></article>`).join('')}</div>
   <p class="muted" style="font-size:13px;margin-top:18px">Resultados de los repartos de TMDB y de Wikidata.</p>`;
}

/* ===================== Sagas ===================== */
const SAGA_HERO = { mcu: 'Avengers: Endgame', sw: 'Star Wars', hp: "Harry Potter and the Philosopher's Stone", lotr: 'The Lord of the Rings: The Fellowship of the Ring', dc: "Zack Snyder's Justice League", ff: 'Fast Five', jp: 'Jurassic Park', mi: 'Mission: Impossible - Fallout', jw: 'John Wick', ts: 'Toy Story' };
const ckey = it => it[0] + '|' + it[1] + '|' + it[2];
async function resolveItem(it, force) {
  const ck = ckey(it); if (L.cache[ck] && !force) return L.cache[ck];
  const type = it[0] === 't' ? 'tv' : 'movie', yk = type === 'tv' ? 'first_air_date_year' : 'primary_release_year';
  try {
    let d = await api(`search/${type}`, { query: it[1], [yk]: it[2] });
    if (!d.results.length) d = await api(`search/${type}`, { query: it[1] });
    const r = d.results[0]; if (!r) return null;
    const n = norm(r, type);
    L.cache[ck] = { id: n.id, type, title: n.title, year: n.year || String(it[2]), poster: n.poster, vote: n.vote, bd: r.backdrop_path || null };
    return L.cache[ck];
  } catch (e) { return null; }
}
async function resolveSaga(s) {
  const todo = s.items.filter(it => !L.cache[ckey(it)]);
  for (let i = 0; i < todo.length; i += 6) await Promise.all(todo.slice(i, i + 6).map(it => resolveItem(it)));
  if (todo.length) saveL();
}
const heroItem = s => s.items.find(it => it[1] === SAGA_HERO[s.id]) || s.items[0];
async function resolveHeroes() {
  const todo = SAGAS.map(heroItem).filter(it => { const c = L.cache[ckey(it)]; return !c || !('bd' in c); });
  await Promise.all(todo.map(it => resolveItem(it, true)));
  if (todo.length) saveL();
  return todo.length;
}
const heroBg = s => { const c = L.cache[ckey(heroItem(s))]; return c && c.bd ? `url('${img(c.bd, 'w780')}')` : 'none'; };
function sagaList(s, mode, withSeries) {
  let arr = s.items.map(it => ({ it, n: L.cache[ckey(it)] }));
  if (!withSeries) arr = arr.filter(x => x.it[0] === 'm');
  if (mode === 'estreno') arr.sort((a, b) => a.it[3].localeCompare(b.it[3]));
  return arr;
}
const isW = x => x.n && D.watched[x.n.type + ':' + x.n.id];
function row(i, n, title, sub, isNext) {
  const k = n && kOf(n), seen = n && D.watched[k];
  if (n) REG[k] = Object.assign(REG[k] || {}, n);
  return `<li class="row${seen ? ' seen' : ''}${isNext ? ' next' : ''}"><span class="num">${i + 1}</span>
  <button class="poster" ${n ? `data-open="${k}"` : 'disabled'} aria-label="${esc(title)}">${n && n.poster ? `<img loading="lazy" src="${img(n.poster, 'w154')}" alt="">` : `<span>${esc(title)}</span>`}</button>
  <div><b>${esc(n ? n.title : title)}${isNext ? '<span class="tag">Sigue</span>' : ''}</b><small>${sub}</small>${seen && seen.rating ? stars(seen.rating) : ''}</div>
  ${n ? `<button class="tick" data-tick="${k}" aria-pressed="${!!seen}" aria-label="Marcar como vista">${icon(T().mark, 20)}</button>` : '<span></span>'}</li>`;
}
function renderSagas() {
  if (arg && arg.startsWith('col')) return renderCollection(+arg.slice(3));
  const s = SAGAS.find(x => x.id === arg);
  if (s) return renderSaga(s);
  const draw = () => {
    app.innerHTML = `<h2 class="sec">Sagas y universos</h2><p class="muted">Elegí una saga para verla en orden, tildar lo que ya viste y saber qué sigue.</p>
    <div class="sagas" style="margin-top:16px">${SAGAS.map(s => {
      const l = sagaList(s, 'crono', L.series[s.id] !== false), w = l.filter(isW).length;
      return `<a class="saga" href="#saga-${s.id}" style="--c1:${s.c1};--c2:${s.c2};--img:${heroBg(s)}"><h3>${esc(s.name)}</h3><div><small>${w} de ${l.length} vistas</small><div class="prog"><i style="width:${l.length ? w / l.length * 100 : 0}%"></i></div></div></a>`;
    }).join('')}</div>
    <h3 class="row-t">Buscar otra saga</h3>
    <p class="muted">TMDB agrupa miles de colecciones: Rocky, James Bond, Shrek, Volver al futuro, El Padrino…</p>
    <form class="tools" id="colform"><div class="search"><input id="colq" enterkeyhint="search" placeholder="Ej: Rocky, Matrix, Shrek…" aria-label="Buscar saga"></div><button class="btn">Buscar</button></form><div id="colres"></div>`;
    $('#colform').onsubmit = async e => {
      e.preventDefault(); const q = $('#colq').value.trim(); if (!q) return; $('#colq').blur();
      $('#colres').innerHTML = spinner();
      try {
        const d = await api('search/collection', { query: q });
        $('#colres').innerHTML = d.results.length ? `<div class="sagas">${d.results.slice(0, 18).map(c => `<a class="saga" href="#saga-col${c.id}" style="--c1:#333;--c2:#111;--img:${c.backdrop_path ? `url('${img(c.backdrop_path, 'w780')}')` : 'none'}"><h3>${esc(c.name)}</h3><div><small>Ver en orden</small></div></a>`).join('')}</div>` : emptyBox('No encontré colecciones con ese nombre.');
      } catch (er) { $('#colres').innerHTML = `<p class="err">${esc(er.message)}</p>`; }
    };
  };
  draw();
  resolveHeroes().then(n => { if (n && view === 'sagas' && !arg) { document.querySelectorAll('.sagas a.saga[href^="#saga-"]').forEach(a => { const s = SAGAS.find(x => '#saga-' + x.id === a.getAttribute('href')); if (s) a.style.setProperty('--img', heroBg(s)); }); } });
}
async function renderSaga(s) {
  const mode = L.order[s.id] || 'crono', ws = L.series[s.id] !== false, hasTv = s.items.some(i => i[0] === 't');
  const draw = () => {
    const l = sagaList(s, mode, ws), nextI = l.findIndex(x => x.n && !isW(x)), w = l.filter(isW).length;
    app.innerHTML = `<a class="back" href="#sagas">← Todas las sagas</a>
    <header class="sagahead" style="--c1:${s.c1};--c2:${s.c2};--img:${heroBg(s)}"><h2 class="sec">${esc(s.name)}</h2><p>${w} de ${l.length} vistas</p></header>
    <div class="tools"><div class="seg" id="oseg"><button data-o="crono" aria-pressed="${mode === 'crono'}">Cronológico</button><button data-o="estreno" aria-pressed="${mode === 'estreno'}">Orden de estreno</button></div>
    ${hasTv ? `<label class="chk"><input type="checkbox" id="wser" ${ws ? 'checked' : ''}> Incluir series</label>` : ''}</div>
    <p class="note">${esc(s.note)}</p>
    <ol class="order">${l.map((x, i) => row(i, x.n, x.it[1], `${x.it[2]} · ${x.it[0] === 't' ? 'Serie' : 'Película'}${x.it[4] ? ' · ' + esc(x.it[4]) : ''}${x.n ? '' : ' · buscando…'}`, i === nextI)).join('')}</ol>`;
    $('#oseg').onclick = e => { const o = e.target.dataset.o; if (o) { L.order[s.id] = o; saveL(); renderSaga(s); } };
    const c = $('#wser'); if (c) c.onchange = () => { L.series[s.id] = c.checked; saveL(); renderSaga(s); };
  };
  draw();
  if (s.items.some(it => !L.cache[ckey(it)])) { await resolveSaga(s); if (view === 'sagas' && arg === s.id) draw(); }
}
async function renderCollection(id) {
  app.innerHTML = spinner();
  try {
    const c = await api('collection/' + id);
    const parts = c.parts.filter(p => p.release_date).sort((a, b) => a.release_date.localeCompare(b.release_date)).concat(c.parts.filter(p => !p.release_date)).map(p => norm(p, 'movie'));
    const nextI = parts.findIndex(n => !D.watched[kOf(n)]);
    app.innerHTML = `<a class="back" href="#sagas">← Todas las sagas</a>
    <header class="sagahead" style="--c1:#333;--c2:#111;--img:${c.backdrop_path ? `url('${img(c.backdrop_path, 'w1280')}')` : 'none'}"><h2 class="sec">${esc(c.name)}</h2><p>${parts.filter(n => D.watched[kOf(n)]).length} de ${parts.length} vistas · orden de estreno</p></header>
    ${c.overview ? `<p class="note">${esc(c.overview)}</p>` : ''}
    <ol class="order">${parts.map((n, i) => row(i, n, n.title, n.year || 'Próximamente', i === nextI)).join('')}</ol>`;
  } catch (e) { app.innerHTML = `<a class="back" href="#sagas">← Volver</a><p class="err">${esc(e.message)}</p>`; }
}

/* ===================== Actores ===================== */
const pp = { q: '', items: [], loading: false, err: '' };
async function renderPeople() {
  const fol = Object.values(D.follows).sort((a, b) => b.at - a.at);
  app.innerHTML = `<h2 class="sec">Actores</h2>${searchTabs('actores')}<p class="muted">Seguí a tus actores y actrices favoritos: te aviso de sus pelis y series en “Para vos”.</p>
  <form class="tools" id="pform" role="search"><div class="search">${icon(SEARCH, 20)}<input id="pq" type="search" enterkeyhint="search" placeholder="Buscar actor, actriz o director…" value="${esc(pp.q)}" aria-label="Buscar personas"></div></form>
  ${fol.length && !pp.q ? `<h3 class="row-t">Siguiendo (${fol.length})</h3><div class="people">${fol.map(f => personCard({ id: f.id, name: f.name, photo: f.photo })).join('')}</div>` : ''}
  <h3 class="row-t">${pp.q ? `Resultados para “${esc(pp.q)}”` : 'Populares ahora'}</h3><div id="pres">${spinner()}</div>`;
  $('#pform').onsubmit = e => { e.preventDefault(); pp.q = $('#pq').value.trim(); pp.items = []; $('#pq').blur(); renderPeople(); };
  $('#pq').oninput = e => { if (!e.target.value && pp.q) { pp.q = ''; pp.items = []; renderPeople(); } };
  if (!pp.items.length) {
    try {
      const d = pp.q ? await api('search/person', { query: pp.q }) : await api('person/popular');
      pp.items = d.results.filter(p => p.profile_path || pp.q).map(p => ({ id: p.id, name: p.name, photo: p.profile_path, sub: (p.known_for || []).map(k => k.title || k.name).filter(Boolean).slice(0, 2).join(', ') }));
      pp.err = '';
    } catch (e) { pp.err = e.message; }
  }
  if (view !== 'actores' || !$('#pres')) return;
  $('#pres').innerHTML = pp.err ? `<p class="err">${esc(pp.err)}</p>` : (pp.items.length ? `<div class="people">${pp.items.map(p => personCard(p, p.sub)).join('')}</div>` : emptyBox('No encontré a nadie con ese nombre.'));
}
const BAD_TV = [10767, 10763, 10764];
function credits(d) {
  const seen = new Set();
  return (d.combined_credits?.cast || [])
    .filter(c => (c.media_type === 'movie' || c.media_type === 'tv') && !(c.genre_ids || []).some(g => BAD_TV.includes(g)))
    .filter(c => { const k = c.media_type + ':' + c.id; if (seen.has(k)) return false; seen.add(k); return true; })
    .map(c => ({ n: norm(c, c.media_type), role: c.character || '', pop: c.popularity || 0, date: c.release_date || c.first_air_date || '' }));
}
const actorState = { type: 'all', sort: 'pop' };
async function renderActor() {
  const id = arg; app.innerHTML = spinner();
  let d;
  try { d = await api('person/' + id, { append_to_response: 'combined_credits' }); }
  catch (e) { app.innerHTML = `<a class="back" href="#actores">← Actores</a><p class="err">${esc(e.message)}</p>`; return; }
  if (view !== 'actor' || arg !== id) return;
  const all = credits(d), on = !!D.follows[id];
  const draw = () => {
    let l = all.filter(c => actorState.type === 'all' || c.n.type === actorState.type);
    l = l.slice().sort(actorState.sort === 'pop' ? (a, b) => b.pop - a.pop : (a, b) => (b.date || '0').localeCompare(a.date || '0'));
    const bio = (d.biography || '').split(/\n+/).filter(Boolean);
    const seenN = all.filter(c => D.watched[kOf(c.n)]).length;
    app.innerHTML = `<a class="back" href="#actores">← Actores</a>
    <section class="actorhead"><div class="face">${d.profile_path ? `<img src="${img(d.profile_path, 'w342')}" alt="">` : ''}</div>
    <div><h2 class="sec">${esc(d.name)}</h2>
    <p class="muted">${[d.known_for_department === 'Acting' ? 'Actuación' : d.known_for_department === 'Directing' ? 'Dirección' : d.known_for_department, d.birthday ? 'Nació el ' + new Date(d.birthday + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : '', d.place_of_birth].filter(Boolean).map(esc).join(' · ')}</p>
    <div class="acts"><button class="btn${on ? ' on' : ''}" data-follow="${id}" data-name="${esc(d.name)}" data-photo="${esc(d.profile_path || '')}" aria-pressed="${on}">${on ? 'Siguiendo' : 'Seguir'}</button>
    <span class="muted" style="align-self:center">Viste ${seenN} de sus ${all.length} títulos</span></div>
    <div class="bio">${bio.length ? `<p>${esc(bio[0])}</p>${bio.length > 1 ? `<details class="more-bio"><summary>Leer más</summary>${bio.slice(1).map(p => `<p>${esc(p)}</p>`).join('')}</details>` : ''}` : '<p class="muted">Todavía no hay biografía en español.</p>'}</div></div></section>
    <div class="tools" style="margin-top:26px"><div class="seg" id="atype"><button data-v="all" aria-pressed="${actorState.type === 'all'}">Todo</button><button data-v="movie" aria-pressed="${actorState.type === 'movie'}">Películas</button><button data-v="tv" aria-pressed="${actorState.type === 'tv'}">Series</button></div>
    <div class="seg" id="asort"><button data-v="pop" aria-pressed="${actorState.sort === 'pop'}">Más conocidas</button><button data-v="new" aria-pressed="${actorState.sort === 'new'}">Más recientes</button></div></div>
    ${l.length ? `<div class="grid">${l.map(c => card(c.n, c.role ? `<small>como ${esc(c.role)}</small>` : '')).join('')}</div>` : emptyBox('Sin títulos para mostrar.')}`;
    $('#atype').onclick = e => { if (e.target.dataset.v) { actorState.type = e.target.dataset.v; draw(); } };
    $('#asort').onclick = e => { if (e.target.dataset.v) { actorState.sort = e.target.dataset.v; draw(); } };
  };
  draw();
}

/* ===================== Recomendaciones ===================== */
// Peso de cada título visto como base: 5★ empuja fuerte, 1-2★ resta a lo parecido.
const weightOf = w => w.rating ? ({ 1: -1, 2: -0.6, 3: 0.35, 4: 1, 5: 1.6 })[w.rating] : 0.7;
function baseOf(W, n = 12) {
  const good = W.filter(w => weightOf(w) > 0).sort((a, b) => (weightOf(b) - weightOf(a)) || (b.at - a.at)).slice(0, n);
  const bad = W.filter(w => weightOf(w) < 0).slice(0, 4);
  return [...good, ...bad];
}
async function recsFrom(bases, exclude, tag) {
  const score = {};
  await Promise.all(bases.map(async (b, bi) => {
    try {
      const d = await api(`${b.type}/${b.id}/recommendations`);
      const wgt = weightOf(b);
      d.results.forEach((r, ri) => {
        const n = norm(r, b.type), k = kOf(n); if (exclude(k)) return;
        const sc = score[k] || (score[k] = { n, s: 0, from: [], who: new Set() });
        sc.s += wgt * ((20 - ri) / 20 + (bases.length - bi) / (bases.length * 2)) + (n.vote || 0) / 25;
        if (wgt > 0 && sc.from.length < 2) sc.from.push(b.title);
        if (tag) sc.who.add(b[tag]);
      });
    } catch (e) {}
  }));
  return Object.values(score).filter(x => x.s > 0 && x.from.length);
}
let recsCache = null;
async function renderRecs() {
  const W = Object.values(D.watched), F = Object.values(D.follows), G = (D.profile && D.profile.fav_genres) || [];
  app.innerHTML = `<div class="headrow"><div><h2 class="sec">Para vos</h2><p class="muted">Según lo que viste, cómo lo puntuaste, los actores que seguís y tus géneros favoritos.</p></div>
  <a class="btn" href="#ruleta">${icon(DICE, 20)}¿Qué vemos hoy?</a></div><div id="recbody">${spinner()}</div>`;
  if (needsAccount() || (!W.length && !F.length && !G.length)) {
    $('#recbody').innerHTML = emptyBox('Marcá lo que ya viste (y puntualo), seguí a algún actor o elegí tus géneros favoritos y acá te armo recomendaciones a tu medida.',
      `<p><a class="btn" href="#explorar">Explorar</a> <a class="btn ghost" href="#actores">Buscar actores</a></p>`);
    return;
  }
  if (!recsCache) {
    const recs = (await recsFrom(baseOf(W), k => !!D.watched[k])).sort((a, b) => b.s - a.s).slice(0, 36);
    const actors = [];
    await Promise.all(F.slice().sort((a, b) => b.at - a.at).slice(0, 10).map(async f => {
      try {
        const d = await api(`person/${f.id}/combined_credits`);
        const l = credits({ combined_credits: d }).filter(c => !D.watched[kOf(c.n)] && c.n.poster).sort((a, b) => b.pop - a.pop).slice(0, 14);
        if (l.length) actors.push({ f, l });
      } catch (e) {}
    }));
    let byGenre = [];
    if (G.length) { try { byGenre = (await api('discover/movie', { with_genres: G.join('|'), sort_by: 'popularity.desc', 'vote_count.gte': 200 })).results.map(r => norm(r, 'movie')).filter(n => !D.watched[kOf(n)]); } catch (e) {} }
    for (const s of SAGAS) if (s.items.some(it => { const n = L.cache[ckey(it)]; return n && D.watched[n.type + ':' + n.id]; })) await resolveSaga(s);
    const next = [];
    for (const s of SAGAS) { const l = sagaList(s, L.order[s.id] || 'crono', L.series[s.id] !== false); if (!l.some(isW)) continue; const x = l.find(x => x.n && !isW(x)); if (x) next.push({ s, n: x.n }); }
    recsCache = { recs, actors, next, byGenre };
  }
  if (view !== 'parati' || !$('#recbody')) return;
  const { recs, actors, next, byGenre } = recsCache;
  const gnames = G.length ? (await genres('movie')).filter(g => G.includes(g.id)).map(g => g.name) : [];
  $('#recbody').innerHTML =
    (next.length ? `<h3 class="row-t">Seguí tus sagas</h3><div class="hrow">${next.map(x => card(x.n, `<small class="why">${esc(x.s.name)}</small>`)).join('')}</div>` : '') +
    actors.map(a => `<h3 class="row-t">${a.f.photo ? `<img src="${img(a.f.photo, 'w92')}" alt="">` : ''}Porque seguís a <a href="#actor-${a.f.id}">${esc(a.f.name)}</a></h3><div class="hrow">${a.l.map(c => card(c.n)).join('')}</div>`).join('') +
    (byGenre.length ? `<h3 class="row-t">Para fans de ${esc(gnames.join(', ').toLowerCase())}</h3><div class="hrow">${byGenre.map(n => card(n)).join('')}</div>` : '') +
    (recs.length ? `<h3 class="row-t">Te van a gustar</h3><div class="grid">${recs.map(r => card(r.n, `<small class="why">Porque te gustó ${esc(r.from[0])}</small>`)).join('')}</div>` : '') +
    `<button class="btn ghost more" id="rerec">Actualizar recomendaciones</button>`;
  $('#rerec').onclick = () => { recsCache = null; renderRecs(); };
}

/* ===================== Juntos (pareja / amigos) ===================== */
let coupleRecs = {};
const jtab = { tab: 'vimos' };
async function partnerLib(uid, force) {
  if (D.plib[uid] && !force) return D.plib[uid];
  const r = await sb.from('library').select('*').eq('user_id', uid).limit(5000);
  const lib = { watched: {}, want: {}, ok: !r.error };
  for (const x of r.data || []) (x.status === 'watched' ? lib.watched : lib.want)[x.media_key] = libRec(x);
  return (D.plib[uid] = lib);
}
async function renderJuntos() {
  if (!CLOUD) { app.innerHTML = `<h2 class="sec">Juntos</h2>${emptyBox('El modo pareja necesita cuentas: se activa cuando la app está conectada a Supabase.')}`; return; }
  if (!user) { app.innerHTML = `<h2 class="sec">Juntos</h2>${emptyBox('Creá tu cuenta para conectarte con tu pareja o amigos, armar listas en común y recibir recomendaciones para ver juntos.', '<a class="btn" href="#yo">Crear cuenta</a>')}`; return; }
  if (arg) return renderCouple(arg);
  app.innerHTML = spinner();
  await loadConns();
  if (view !== 'juntos' || arg) return;
  const inc = D.conns.filter(c => c.status === 'pending' && c.incoming), out = D.conns.filter(c => c.status === 'pending' && !c.incoming), acc = accepted();
  const link = location.origin + location.pathname + '#u-' + (D.profile?.username || '');
  app.innerHTML = `<h2 class="sec">Juntos</h2><p class="muted">Conectate con tu pareja o amigos: listas en común, recomendaciones para ver juntos y la ruleta para decidir sin discutir.</p>
  ${inc.length ? `<h3 class="row-t">Invitaciones para vos</h3><div class="conns">${inc.map(c => `<div class="conn">${pAvatar(c.other, 52)}<div><b>${esc(pName(c.other))}</b><small>@${esc(c.other.username)} quiere conectarse con vos</small></div><div class="acts"><button class="btn small" data-accept="${c.id}">Aceptar</button><button class="btn ghost small" data-remove="${c.id}">Rechazar</button></div></div>`).join('')}</div>` : ''}
  <h3 class="row-t">Tus conexiones</h3>
  ${acc.length ? `<div class="conns">${acc.map(c => { const n = Object.values(D.cpl[c.id] || {}); return `<a class="conn link" href="#juntos-${c.id}"><span class="pair">${myAvatar(52)}${pAvatar(c.other, 52)}</span><div><b>Vos y ${esc(pName(c.other))}</b><small>${n.filter(x => x.status === 'watched').length} vistas juntos · ${n.filter(x => x.status === 'want').length} para ver</small></div><span class="go">›</span></a>`; }).join('')}</div>` : emptyBox('Todavía no tenés conexiones. Invitá a alguien con su nombre de usuario.')}
  <form class="box" id="invf" style="margin-top:18px"><b>Invitar a alguien</b>
   <div class="field" style="margin-bottom:6px"><input id="invu" placeholder="@usuario" autocapitalize="none" autocomplete="off" aria-label="Usuario a invitar"></div>
   <button class="btn">Enviar invitación</button> <span class="err" id="inverr"></span>
   <p class="muted" style="margin:12px 0 0;font-size:14px">Tu usuario es <b>@${esc(D.profile?.username || '')}</b>. También podés pasarle tu perfil: <button type="button" class="linkbtn" id="cpy">copiar link</button></p></form>
  ${out.length ? `<h3 class="row-t">Invitaciones enviadas</h3><div class="conns">${out.map(c => `<div class="conn">${pAvatar(c.other, 44)}<div><b>${esc(pName(c.other))}</b><small>Esperando que acepte</small></div><button class="btn ghost small" data-remove="${c.id}">Cancelar</button></div>`).join('')}</div>` : ''}`;
  $('#invf').onsubmit = async e => {
    e.preventDefault();
    const u = $('#invu').value.trim().replace(/^@/, '').toLowerCase(); const out = m => $('#inverr').textContent = m;
    if (!u) return;
    if (u === D.profile?.username) return out('Ese sos vos 😉');
    try { await invite(u); $('#invu').value = ''; toast('Invitación enviada a @' + u); renderJuntos(); } catch (er) { out(er.message); }
  };
  $('#cpy').onclick = () => copyText(link, 'Link copiado');
}
async function invite(username) {
  const p = await sb.from('profiles').select('id,username').eq('username', username).maybeSingle();
  if (!p.data) throw new Error('No existe ningún usuario @' + username + '.');
  if (D.conns.some(c => c.otherId === p.data.id)) throw new Error('Ya tenés una conexión o invitación con @' + username + '.');
  const r = await sb.from('connections').insert({ requester: user.id, addressee: p.data.id });
  if (r.error) throw new Error(r.error.code === '23505' ? 'Ya existe una invitación entre ustedes.' : 'No se pudo enviar: ' + r.error.message);
  await loadConns();
}
async function connAction(kind, id) {
  const r = kind === 'accept' ? await sb.from('connections').update({ status: 'accepted' }).eq('id', id) : await sb.from('connections').delete().eq('id', id);
  if (r.error) return toast('No se pudo: ' + r.error.message);
  await loadConns(); toast(kind === 'accept' ? '¡Conectados! Ya pueden armar su lista' : 'Listo');
  if (kind === 'remove' && view === 'juntos' && arg) return go('juntos');
  render();
}
async function renderCouple(cid) {
  let c = D.conns.find(x => x.id === cid && x.status === 'accepted');
  if (!c) { await loadConns(); c = D.conns.find(x => x.id === cid && x.status === 'accepted'); }
  if (!c) { app.innerHTML = `<a class="back" href="#juntos">← Juntos</a>${emptyBox('Esta conexión no existe o todavía no fue aceptada.')}`; return; }
  const list = Object.entries(D.cpl[cid] || {});
  const vimos = list.filter(([, v]) => v.status === 'watched').sort((a, b) => b[1].at - a[1].at), queremos = list.filter(([, v]) => v.status === 'want').sort((a, b) => b[1].at - a[1].at);
  app.innerHTML = `<a class="back" href="#juntos">← Juntos</a>
  <section class="couple"><span class="pair big">${myAvatar(96)}${pAvatar(c.other, 96)}</span><div><h2 class="sec">Vos y ${esc(pName(c.other))}</h2>
   <div class="acts"><a class="btn" href="#ruleta-${cid}">${icon(DICE, 20)}¿Qué vemos hoy?</a><button class="btn ghost" id="goadd">+ Agregar las que ya vimos</button><a class="btn ghost" href="#u-${esc(c.other.username)}">Ver perfil de ${esc(pName(c.other))}</a></div></div></section>
  <div class="tools"><div class="seg" id="jt"><button data-v="vimos" aria-pressed="${jtab.tab === 'vimos'}">Vimos juntos (${vimos.length})</button><button data-v="queremos" aria-pressed="${jtab.tab === 'queremos'}">Queremos ver (${queremos.length})</button><button data-v="recs" aria-pressed="${jtab.tab === 'recs'}">Para ver juntos</button><button data-v="agregar" aria-pressed="${jtab.tab === 'agregar'}">+ Agregar vistas antes</button></div></div>
  <div id="jbody"></div>
  <p class="muted" style="margin-top:34px;font-size:14px">Para sumar títulos a esta lista, abrí cualquier peli o serie y tocá “La vimos juntos” o “Queremos verla”. <button class="linkbtn" data-remove="${cid}">Desconectarse</button></p>`;
  $('#jt').onclick = e => { if (e.target.dataset.v) { jtab.tab = e.target.dataset.v; renderCouple(cid); } };
  $('#goadd').onclick = () => { jtab.tab = 'agregar'; renderCouple(cid); setTimeout(() => $('#jt')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); };
  const body = $('#jbody');
  if (jtab.tab === 'agregar') return renderAddTogether(cid, c, body);
  if (jtab.tab !== 'recs') {
    const l = jtab.tab === 'vimos' ? vimos : queremos;
    body.innerHTML = l.length ? `<div class="grid">${l.map(([, v]) => card(v, v.by && v.by !== user.id ? `<small class="why">Lo sumó ${esc(pName(c.other))}</small>` : '')).join('')}</div>` : emptyBox(jtab.tab === 'vimos' ? 'Todavía no marcaron nada como visto juntos.<br><br><button class="btn" data-jtab="agregar">+ Agregar las que ya vieron juntos</button>' : 'Su lista para ver juntos está vacía. Probá la ruleta o las recomendaciones.');
    return;
  }
  body.innerHTML = spinner('Cruzando sus gustos…');
  if (!coupleRecs[cid]) {
    const pl = await partnerLib(c.otherId);
    const myW = Object.values(D.watched).map(w => ({ ...w, who: 'yo' })), hisW = Object.values(pl.watched).map(w => ({ ...w, who: 'otro' }));
    const togetherW = vimos.map(([, v]) => ({ ...v, rating: 5, who: 'juntos' }));
    const seenAny = k => !!(D.watched[k] || pl.watched[k] || (D.cpl[cid][k] && D.cpl[cid][k].status === 'watched'));
    const bases = [...baseOf(togetherW, 6), ...baseOf(myW, 7), ...baseOf(hisW, 7)];
    const recs = (await recsFrom(bases, seenAny, 'who')).map(x => ({ ...x, s: x.s * (x.who.size > 1 ? 1.8 : 1) })).sort((a, b) => b.s - a.s).slice(0, 30);
    let g = [];
    const gm = (D.profile?.fav_genres || []), go2 = (c.other.fav_genres || []);
    const common = gm.filter(x => go2.includes(x));
    const gq = common.length ? common.join('|') : [...new Set([...gm, ...go2])].join('|');
    if (gq) { try { g = (await api('discover/movie', { with_genres: gq, sort_by: 'popularity.desc', 'vote_count.gte': 300 })).results.map(r => norm(r, 'movie')).filter(n => !seenAny(kOf(n))); } catch (e) {} }
    coupleRecs[cid] = { recs, g, common: common.length > 0, ok: pl.ok };
  }
  if (view !== 'juntos' || arg !== cid || jtab.tab !== 'recs') return;
  const cr = coupleRecs[cid];
  body.innerHTML = (cr.g.length ? `<h3 class="row-t">${cr.common ? 'De los géneros que les gustan a los dos' : 'Mezclando sus géneros favoritos'}</h3><div class="hrow">${cr.g.map(n => card(n)).join('')}</div>` : '') +
    (cr.recs.length ? `<h3 class="row-t">Les van a gustar a los dos</h3><div class="grid">${cr.recs.map(r => card(r.n, `<small class="why">${r.who.size > 1 ? '♥ Coincide con los dos' : 'Por ' + esc(r.from[0])}</small>`)).join('')}</div>` : '') +
    (!cr.recs.length && !cr.g.length ? emptyBox('Necesito un poco más de datos: marquen y puntúen algunas pelis, o elijan sus géneros favoritos en el perfil.') : '') +
    `<button class="btn ghost more" id="rrc">Actualizar</button>`;
  $('#rrc').onclick = () => { delete coupleRecs[cid]; delete D.plib[c.otherId]; renderCouple(cid); };
}

/* ===================== Agregar lo que ya vieron juntos ===================== */
const aj = { q: '', res: [], mine: true, loading: false };
const inTogether = (cid, k) => (D.cpl[cid] || {})[k]?.status === 'watched';
function addCard(cid, n) {
  const k = kOf(n); REG[k] = Object.assign(REG[k] || {}, n);
  const on = inTogether(cid, k);
  return `<article class="card addcard${on ? ' added' : ''}" data-k="${k}">
  <button class="poster" data-open="${k}" aria-label="${esc(n.title)}">${n.poster ? `<img loading="lazy" src="${img(n.poster)}" alt="">` : `<span>${esc(n.title)}</span>`}</button>
  <div class="meta"><b>${esc(n.title)}</b><small>${n.year || '—'} · ${n.type === 'tv' ? 'Serie' : 'Película'}</small></div>
  <button class="addj" data-addj="${cid}|${k}" aria-pressed="${on}">${on ? '✓ La vimos juntos' : '+ La vimos juntos'}</button></article>`;
}
async function addTogether(cid, keys, add) {
  const list = D.cpl[cid]; if (!list) return;
  const rows = [];
  for (const k of keys) {
    const n = REG[k] || D.watched[k] || D.want[k]; if (!n) continue;
    if (add) {
      if (!inTogether(cid, k)) {
        list[k] = { ...n, status: 'watched', at: Date.now(), by: user.id, watched_on: null };
        rows.push({ connection_id: cid, media_key: k, status: 'watched', tmdb_id: n.id, media_type: n.type, title: n.title, poster: n.poster || null, year: n.year || '', vote: n.vote || 0, watched_on: null });
      }
      if (aj.mine && !D.watched[k]) setStatus(k, 'watched', { watched_on: null });
    } else if (list[k]) {
      delete list[k];
      cloudErr(await sb.from('couple_items').delete().eq('connection_id', cid).eq('media_key', k));
    }
  }
  if (rows.length) cloudErr(await sb.from('couple_items').upsert(rows));
  coupleRecs = {};
  document.querySelectorAll('[data-addj]').forEach(b => { const [c2, k] = b.dataset.addj.split('|'); const on = inTogether(c2, k); b.setAttribute('aria-pressed', on); b.textContent = on ? '✓ La vimos juntos' : '+ La vimos juntos'; b.closest('.card')?.classList.toggle('added', on); });
  const cnt = Object.values(list).filter(v => v.status === 'watched').length;
  const tab = document.querySelector('#jt [data-v=vimos]'); if (tab) tab.textContent = `Vimos juntos (${cnt})`;
  const bulk = $('#ajall'); if (bulk) { const left = JSON.parse(bulk.dataset.keys).filter(k => !inTogether(cid, k)).length; bulk.hidden = !left; bulk.textContent = left === 1 ? 'Agregarla' : `Agregar las ${left}`; }
  if (add) toast(rows.length > 1 ? `Agregadas ${rows.length} a “vimos juntos”` : 'Agregada a “vimos juntos”');
}
async function renderAddTogether(cid, c, body) {
  body.innerHTML = `<section class="box addj-box">
   <h3>¿Qué vieron juntos antes?</h3>
   <p class="muted" style="margin-top:-4px">Buscá cada peli o serie y tocá “+ La vimos juntos”. Se guardan sin fecha, así no se mezclan con el resumen del mes.</p>
   <form class="tools" id="ajf" role="search" style="margin-bottom:6px"><div class="search">${icon(SEARCH, 20)}<input id="ajq" type="search" enterkeyhint="search" placeholder="Ej: Titanic, Friends, Toy Story…" value="${esc(aj.q)}" aria-label="Buscar lo que vieron juntos"></div><button class="btn">Buscar</button></form>
   <label class="chk"><input type="checkbox" id="ajmine" ${aj.mine ? 'checked' : ''}> Marcarlas también como vistas en mi lista</label>
   <div id="ajres" style="margin-top:12px"></div></section>
  <div id="ajboth">${spinner('Buscando lo que vieron los dos…')}</div>`;
  $('#ajmine').onchange = e => { aj.mine = e.target.checked; };
  const drawRes = () => {
    const box = $('#ajres'); if (!box) return;
    box.innerHTML = aj.loading ? spinner() : aj.res.length ? `<div class="grid">${aj.res.map(n => addCard(cid, n)).join('')}</div>` : (aj.q ? emptyBox('No encontré nada con esa búsqueda.') : '');
  };
  $('#ajf').onsubmit = async e => {
    e.preventDefault(); aj.q = $('#ajq').value.trim(); if (!aj.q) return; $('#ajq').blur();
    aj.loading = true; drawRes();
    try { aj.res = (await api('search/multi', { query: aj.q })).results.filter(r => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 18).map(r => norm(r, r.media_type)); }
    catch (er) { aj.res = []; toast(er.message); }
    aj.loading = false; drawRes();
  };
  drawRes();
  const pl = await partnerLib(c.otherId);
  if (view !== 'juntos' || jtab.tab !== 'agregar' || !$('#ajboth')) return;
  const both = Object.entries(D.watched).filter(([k]) => pl.watched[k]).map(([k, v]) => (REG[k] = Object.assign(REG[k] || {}, v)));
  const left = both.filter(n => !inTogether(cid, kOf(n)));
  $('#ajboth').innerHTML = both.length ? `<div class="headrow" style="margin-top:28px"><div><h3 class="row-t" style="margin:0">Las vieron los dos</h3><p class="muted" style="margin:4px 0 0">Están en tu lista y en la de ${esc(pName(c.other))}. ¿Alguna la vieron juntos?</p></div>
    <button class="btn" id="ajall" data-keys='${esc(JSON.stringify(both.map(kOf)))}' ${left.length ? '' : 'hidden'}>${left.length === 1 ? 'Agregarla' : `Agregar las ${left.length}`}</button></div>
    <div class="grid" style="margin-top:14px">${both.map(n => addCard(cid, n)).join('')}</div>`
    : (pl.ok ? '' : '<p class="muted">No pude ver la lista de tu pareja.</p>');
  const all = $('#ajall'); if (all) all.onclick = () => addTogether(cid, JSON.parse(all.dataset.keys), true);
}

/* ===================== Perfil de otra persona ===================== */
const ut = { tab: 'vistas' };
async function renderUser() {
  const uname = String(arg || '').toLowerCase();
  if (!CLOUD) return go('yo');
  if (D.profile && uname === D.profile.username) return go('yo');
  app.innerHTML = spinner();
  const p = await sb.from('profiles').select('*').eq('username', uname).maybeSingle();
  if (view !== 'perfil') return;
  if (!p.data) { app.innerHTML = emptyBox('No existe ningún usuario @' + esc(uname) + '.', '<a class="btn" href="#juntos">Volver</a>'); return; }
  const u = p.data, c = D.conns.find(x => x.otherId === u.id);
  const connected = c && c.status === 'accepted';
  const visible = u.is_public || connected;
  let lib = null;
  if (visible && user) lib = await partnerLib(u.id, true);
  if (view !== 'perfil') return;
  const W = lib ? Object.entries(lib.watched) : [], A = lib ? Object.entries(lib.want) : [];
  const btn = !user ? '<a class="btn" href="#yo">Creá tu cuenta para conectarte</a>' : !c ? `<button class="btn" data-invite="${esc(u.username)}">Conectar</button>` : c.status === 'pending' ? (c.incoming ? `<button class="btn" data-accept="${c.id}">Aceptar invitación</button>` : '<span class="muted">Invitación enviada</span>') : `<a class="btn" href="#juntos-${c.id}">Ver lista juntos</a>`;
  const l = (ut.tab === 'vistas' ? W : A).map(([k, v]) => (REG[k] = Object.assign(REG[k] || {}, { id: v.id, type: v.type, title: v.title, poster: v.poster, year: v.year, vote: v.vote }), v)).sort((a, b) => b.at - a.at);
  app.innerHTML = `<section class="profile">${pAvatar(u, 140)}<div><h2>${esc(pName(u))}</h2><div class="handle">@${esc(u.username)}</div>${u.bio ? `<p style="margin:8px 0 0">${esc(u.bio)}</p>` : ''}
   ${visible && lib ? `<div class="stats"><div class="stat"><b>${W.filter(([k]) => k.startsWith('movie')).length}</b><span>películas</span></div><div class="stat"><b>${W.filter(([k]) => k.startsWith('tv')).length}</b><span>series</span></div><div class="stat"><b>${A.length}</b><span>quiere ver</span></div></div>` : ''}
   <div class="acts">${btn}</div></div></section>
  ${!visible ? emptyBox('Este perfil es privado. Cuando se conecten, van a poder ver sus listas.') : !user ? emptyBox('Entrá con tu cuenta para ver sus listas.') : `
  <div class="tools" style="margin-top:22px"><div class="seg" id="ut"><button data-v="vistas" aria-pressed="${ut.tab === 'vistas'}">Vio (${W.length})</button><button data-v="quiere" aria-pressed="${ut.tab === 'quiere'}">Quiere ver (${A.length})</button></div></div>
  ${l.length ? `<div class="grid">${l.map(v => card(v, v.rating ? `<small class="why">Le puso ${v.rating}★</small>${v.review ? `<small class="rv">“${esc(v.review)}”</small>` : ''}` : '')).join('')}</div>` : emptyBox('Nada por acá todavía.')}`}`;
  if ($('#ut')) $('#ut').onclick = e => { if (e.target.dataset.v) { ut.tab = e.target.dataset.v; renderUser(); } };
}

/* ===================== Ruleta: ¿qué vemos hoy? ===================== */
const ru = { type: 'movie', time: 'any', provs: [], src: 'surprise', result: null, spinning: false };
let provCache = null;
async function providers() {
  if (provCache) return provCache;
  try {
    const d = await api('watch/providers/movie', { watch_region: L.region });
    provCache = d.results.sort((a, b) => (a.display_priorities?.[L.region] ?? a.display_priority ?? 99) - (b.display_priorities?.[L.region] ?? b.display_priority ?? 99)).slice(0, 12).map(p => ({ id: p.provider_id, name: p.provider_name, logo: p.logo_path }));
  } catch (e) { provCache = []; }
  return provCache;
}
async function renderRoulette() {
  const cid = arg; const c = cid ? D.conns.find(x => x.id === cid) : null;
  if (cid && !c) { await loadConns(); if (!D.conns.find(x => x.id === cid)) return go('juntos'); return renderRoulette(); }
  const pv = await providers();
  if (view !== 'ruleta' || arg !== cid) return;
  app.innerHTML = `<a class="back" href="${cid ? '#juntos-' + cid : '#parati'}">← ${cid ? 'Juntos' : 'Para vos'}</a>
  <h2 class="sec">¿Qué vemos hoy?</h2><p class="muted">${c ? `Para vos y ${esc(pName(c.other))}: deja afuera lo que ya vio cualquiera de los dos.` : 'Elegí cuánto tiempo tenés y dónde, y que decida la suerte.'}</p>
  <div class="roulette"><div class="ropts box">
   <div class="field"><span>¿Qué?</span><div class="seg" id="r-type"><button data-v="movie" aria-pressed="${ru.type === 'movie'}">Película</button><button data-v="tv" aria-pressed="${ru.type === 'tv'}">Serie</button></div></div>
   <div class="field" ${ru.type === 'tv' ? 'hidden' : ''}><span>¿Cuánto tiempo tienen?</span><div class="seg" id="r-time"><button data-v="105" aria-pressed="${ru.time === '105'}">Hasta 1 h 45</button><button data-v="135" aria-pressed="${ru.time === '135'}">Hasta 2 h 15</button><button data-v="any" aria-pressed="${ru.time === 'any'}">Sin apuro</button></div></div>
   <div class="field"><span>¿De dónde?</span><div class="seg" id="r-src"><button data-v="surprise" aria-pressed="${ru.src === 'surprise'}">Sorprendeme</button><button data-v="list" aria-pressed="${ru.src === 'list'}">${c ? 'Nuestra' : 'Mi'} lista</button></div></div>
   ${pv.length && ru.src === 'surprise' ? `<div class="field"><span>Plataformas que tienen</span><div class="provpick" id="r-prov">${pv.map(p => `<button data-v="${p.id}" aria-pressed="${ru.provs.includes(p.id)}" title="${esc(p.name)}"><img src="${img(p.logo, 'w92')}" alt="${esc(p.name)}"></button>`).join('')}</div><small>Si no elegís ninguna, busca en todas.</small></div>` : ''}
   <button class="btn spinbtn" id="spin">${icon(DICE, 22)}Girar la ruleta</button></div>
   <div class="rstage" id="rstage">${ru.result ? resultCard(ru.result) : `<div class="rslot idle">${icon(DICE, 64)}<p>Tocá “Girar la ruleta”</p></div>`}</div></div>`;
  const seg = (id, key, rerender) => { $(id).onclick = e => { const b = e.target.closest('button'); if (!b) return; ru[key] = b.dataset.v; if (rerender) renderRoulette(); else $(id).querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); }; };
  seg('#r-type', 'type', true); seg('#r-time', 'time'); seg('#r-src', 'src', true);
  if ($('#r-prov')) $('#r-prov').onclick = e => { const b = e.target.closest('button'); if (!b) return; const id = +b.dataset.v; ru.provs = ru.provs.includes(id) ? ru.provs.filter(x => x !== id) : [...ru.provs, id]; b.setAttribute('aria-pressed', ru.provs.includes(id)); };
  $('#spin').onclick = () => spin(c);
  if ($('#again')) $('#again').onclick = () => spin(c);
}
function resultCard(n) {
  const k = kOf(n);
  return `<div class="rresult"><button class="poster" data-open="${k}">${n.poster ? `<img src="${img(n.poster, 'w500')}" alt="">` : `<span>${esc(n.title)}</span>`}</button>
   <div><p class="muted" style="margin:0">La ruleta eligió…</p><h3>${esc(n.title)}</h3><p class="muted">${n.year || ''} · ${n.type === 'tv' ? 'Serie' : 'Película'}${n.vote ? ` · ★ ${(+n.vote).toFixed(1)}` : ''}</p>${n.ov ? `<p class="rov">${esc(n.ov)}</p>` : ''}
   <div class="acts"><button class="btn" data-open="${k}">Ver ficha</button>${D.want[k] || D.watched[k] ? '' : `<button class="btn ghost" data-want="${k}">${icon(T().want, 18)}Guardar</button>`}<button class="btn ghost" id="again">Otra</button></div></div></div>`;
}
async function spin(c) {
  if (ru.spinning) return;
  if (needsAccount() && ru.src === 'list') return askAccount();
  ru.spinning = true; const st = $('#rstage'); const btn = $('#spin'); btn.disabled = true;
  st.innerHTML = `<div class="rslot"><div class="rimg"></div><p>Girando…</p></div>`;
  let pool = [];
  let seenAny = k => !!D.watched[k];
  try {
    if (c) { const pl = await partnerLib(c.otherId); const cw = D.cpl[c.id] || {}; seenAny = k => !!(D.watched[k] || pl.watched[k] || (cw[k] && cw[k].status === 'watched')); }
    if (ru.src === 'list') {
      const src = c ? Object.values(D.cpl[c.id] || {}).filter(v => v.status === 'want') : Object.values(D.want);
      pool = src.filter(v => v.type === ru.type).filter(v => !seenAny(kOf(v)));
    } else {
      const G = c ? [...new Set([...(D.profile?.fav_genres || []), ...(c.other.fav_genres || [])])] : (D.profile?.fav_genres || []);
      const params = { sort_by: 'popularity.desc', 'vote_count.gte': ru.type === 'movie' ? 300 : 150, watch_region: L.region, page: 1 + Math.floor(Math.random() * 3) };
      if (ru.provs.length) { params.with_watch_providers = ru.provs.join('|'); params.with_watch_monetization_types = 'flatrate|free|ads'; }
      if (ru.type === 'movie' && ru.time !== 'any') { params['with_runtime.lte'] = ru.time; params['with_runtime.gte'] = 60; }
      if (G.length) params.with_genres = G.join('|');
      let d = await api(`discover/${ru.type}`, params);
      pool = d.results.map(r => norm(r, ru.type)).filter(n => !seenAny(kOf(n)) && n.poster);
      if (pool.length < 3 && G.length) { delete params.with_genres; params.page = 1; d = await api(`discover/${ru.type}`, params); pool = d.results.map(r => norm(r, ru.type)).filter(n => !seenAny(kOf(n)) && n.poster); }
    }
  } catch (e) { st.innerHTML = `<p class="err">${esc(e.message)}</p>`; ru.spinning = false; btn.disabled = false; return; }
  if (!pool.length) { st.innerHTML = emptyBox(ru.src === 'list' ? 'No hay títulos de ese tipo en la lista “quiero ver”. Probá con “Sorprendeme”.' : 'No encontré nada con esos filtros. Probá sacando alguna plataforma o el límite de tiempo.'); ru.spinning = false; btn.disabled = false; return; }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frames = reduce ? 0 : 16; const box = st.querySelector('.rimg');
  for (let i = 0; i < frames; i++) {
    const n = i === frames - 1 ? pick : pool[Math.floor(Math.random() * pool.length)];
    if (box && n.poster) box.style.backgroundImage = `url('${img(n.poster, 'w342')}')`;
    await new Promise(r => setTimeout(r, 45 + i * i * 1.6));
  }
  ru.result = pick; ru.spinning = false;
  if (view !== 'ruleta') return;
  st.innerHTML = resultCard(pick); btn.disabled = false;
  if (innerWidth < 760) st.scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('#again').onclick = () => spin(c);
}

/* ===================== Resumen del mes / año ===================== */
const sm = { period: 'month' };
function periodRange(p) {
  const d = new Date(), y = d.getFullYear(), m = d.getMonth();
  const pad = x => String(x).padStart(2, '0');
  const ym = (yy, mm) => `${yy}-${pad(mm + 1)}`;
  const mname = (yy, mm) => new Date(yy, mm, 15).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  if (p === 'month') return { from: ym(y, m) + '-01', to: ym(y, m) + '-31', label: mname(y, m) };
  if (p === 'prev') { const pm = m === 0 ? 11 : m - 1, py = m === 0 ? y - 1 : y; return { from: ym(py, pm) + '-01', to: ym(py, pm) + '-31', label: mname(py, pm) }; }
  if (p === 'year') return { from: `${y}-01-01`, to: `${y}-12-31`, label: String(y), year: y };
  if (p === 'lastyear') return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31`, label: String(y - 1), year: y - 1 };
  return { from: '0000', to: '9999', label: 'desde que empezaste', all: true };
}
async function metaOf(n) {
  const k = kOf(n); if (L.meta[k]) return L.meta[k];
  try {
    const d = await api(`${n.type}/${n.id}`, { append_to_response: n.type === 'movie' ? 'credits' : 'aggregate_credits' });
    const cast = (n.type === 'movie' ? d.credits?.cast : d.aggregate_credits?.cast) || [];
    L.meta[k] = { rt: n.type === 'movie' ? (d.runtime || 0) : 0, g: (d.genres || []).map(g => g.id), c: cast.slice(0, 5).map(x => [x.id, x.name, x.profile_path || '']) };
    return L.meta[k];
  } catch (e) { return null; }
}
async function renderSummary() {
  const r = periodRange(sm.period);
  const items = Object.entries(D.watched).map(([k, w]) => ({ k, w, day: dayOf(w) })).filter(x => x.day && x.day >= r.from && x.day <= r.to).sort((a, b) => b.day.localeCompare(a.day));
  const tabs = [['month', 'Este mes'], ['prev', 'Mes pasado'], ['year', 'Este año'], ['lastyear', 'Año pasado'], ['all', 'Todo']];
  app.innerHTML = `<a class="back" href="#yo">← Yo</a><h2 class="sec">Tu resumen</h2>
  <div class="chips" id="smp">${tabs.map(([v, l]) => `<button data-v="${v}" aria-pressed="${sm.period === v}">${l}</button>`).join('')}</div><div id="smb" style="margin-top:14px"></div>`;
  $('#smp').onclick = e => { const b = e.target.closest('button'); if (b) { sm.period = b.dataset.v; renderSummary(); } };
  const box = $('#smb');
  if (!items.length) { box.innerHTML = emptyBox(`No marcaste nada como visto en ${esc(r.label)}. Cuando tildás una peli se guarda la fecha; si la viste hace mucho, podés cambiarla en su ficha.`); return; }
  const todo = items.slice(0, 150).filter(x => !L.meta[x.k]);
  for (let i = 0; i < todo.length; i += 6) {
    box.innerHTML = spinner(`Analizando ${Math.min(i + 6, todo.length)} de ${todo.length} títulos…`);
    await Promise.all(todo.slice(i, i + 6).map(x => metaOf(x.w)));
    if (view !== 'resumen') return;
  }
  if (todo.length) saveL();
  const mv = items.filter(x => x.w.type === 'movie'), tv = items.filter(x => x.w.type === 'tv');
  const mins = mv.reduce((s, x) => s + (L.meta[x.k]?.rt || 0), 0);
  const gc = {}, ac = {};
  for (const x of items) { const m = L.meta[x.k]; if (!m) continue; m.g.forEach(g => gc[g] = (gc[g] || 0) + 1); m.c.forEach(([id, name, ph], i) => { const a = ac[id] || (ac[id] = { id, name, ph, n: 0, s: 0 }); a.n++; a.s += 5 - i; }); }
  const gl = [...await genres('movie'), ...await genres('tv')]; const gname = id => (gl.find(g => g.id === +id) || {}).name || 'Otros';
  const topG = Object.entries(gc).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topA = Object.values(ac).filter(a => a.n > 1).sort((a, b) => b.n - a.n || b.s - a.s).slice(0, 3);
  const rated = items.filter(x => x.w.rating).sort((a, b) => b.w.rating - a.w.rating || b.day.localeCompare(a.day));
  const avg = rated.length ? (rated.reduce((s, x) => s + x.w.rating, 0) / rated.length) : 0;
  let bars = '';
  if (r.year || r.all) {
    const by = {}; items.forEach(x => { const key = r.all ? x.day.slice(0, 4) : x.day.slice(5, 7); by[key] = (by[key] || 0) + 1; });
    const keys = r.all ? Object.keys(by).sort() : Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const mx = Math.max(...keys.map(k => by[k] || 0), 1);
    const lab = k => r.all ? k : new Date(2000, +k - 1, 1).toLocaleDateString('es-AR', { month: 'short' }).replace('.', '');
    bars = `<section class="box"><h3>${r.all ? 'Por año' : 'Mes a mes'}</h3><div class="cols">${keys.map(k => `<div class="col"><span class="v">${by[k] || ''}</span><i style="height:${(by[k] || 0) / mx * 100}%"></i><span class="l">${lab(k)}</span></div>`).join('')}</div></section>`;
  }
  const h = Math.floor(mins / 60);
  const shareTxt = `Mi resumen de cine de ${r.label} en MiCine: ${mv.length} películas y ${tv.length} series${h ? `, ${h} horas de películas` : ''}${topG.length ? `. Mi género top: ${gname(topG[0][0])}` : ''}${topA.length ? `. Actor más visto: ${topA[0].name}` : ''}${rated[0] ? `. Mi favorita: ${rated[0].w.title}` : ''}. 🎬`;
  box.innerHTML = `<section class="wrap-hero"><p class="wh">Tu ${r.all ? 'historia' : r.year ? 'año' : 'mes'} en el cine · ${esc(r.label)}</p>
   <div class="big3"><div><b>${mv.length}</b><span>películas</span></div><div><b>${tv.length}</b><span>series</span></div><div><b>${h}<small> h</small></b><span>de películas</span></div></div>
   ${rated.length ? `<p class="avg"><span>Promedio de tus puntajes</span>${stars(Math.round(avg), 16)}<b>${avg.toFixed(1)}</b></p>` : ''}</section>
  <div class="sumgrid">
   ${topG.length ? `<section class="box"><h3>Tus géneros</h3>${topG.map(([g, n]) => `<div class="hbar"><span>${esc(gname(g))}</span><i style="width:${n / topG[0][1] * 100}%"></i><b>${n}</b></div>`).join('')}</section>` : ''}
   ${topA.length ? `<section class="box"><h3>Más viste a…</h3>${topA.map((a, i) => `<a class="arow" href="#actor-${a.id}"><span class="face">${a.ph ? `<img src="${img(a.ph, 'w185')}" alt="">` : ''}</span><div><b>${i === 0 ? '👑 ' : ''}${esc(a.name)}</b><small>en ${a.n} títulos</small></div></a>`).join('')}</section>` : ''}
   ${rated.length ? `<section class="box"><h3>Tus mejor puntuadas</h3>${rated.slice(0, 3).map(x => `<button class="arow" data-open="${x.k}"><span class="face sq">${x.w.poster ? `<img src="${img(x.w.poster, 'w154')}" alt="">` : ''}</span><div><b>${esc(x.w.title)}</b>${stars(x.w.rating)}${x.w.review ? `<small>“${esc(x.w.review)}”</small>` : ''}</div></button>`).join('')}</section>` : ''}
  </div>
  ${bars}
  <h3 class="row-t">Todo lo que viste</h3><div class="wall">${items.slice(0, 60).map(x => { REG[x.k] = Object.assign(REG[x.k] || {}, x.w); return `<button data-open="${x.k}" title="${esc(x.w.title)}">${x.w.poster ? `<img loading="lazy" src="${img(x.w.poster, 'w154')}" alt="${esc(x.w.title)}">` : `<span>${esc(x.w.title)}</span>`}</button>`; }).join('')}</div>
  <div class="acts" style="justify-content:center;margin-top:24px"><button class="btn" id="shr">Compartir mi resumen</button></div>
  <p class="muted" style="text-align:center;font-size:13px">Las horas cuentan solo películas. Lo que marcaste con “no me acuerdo cuándo la vi” no entra en los resúmenes por fecha.</p>`;
  $('#shr').onclick = async () => {
    const data = { title: 'Mi resumen en MiCine', text: shareTxt, url: location.origin + location.pathname };
    if (navigator.share) { try { await navigator.share(data); return; } catch (e) { if (e.name === 'AbortError') return; } }
    copyText(shareTxt + ' ' + data.url, 'Resumen copiado: pegalo donde quieras');
  };
}
function copyText(t, msg) { (navigator.clipboard?.writeText(t) || Promise.reject()).then(() => toast(msg), () => { prompt('Copiá este texto:', t); }); }

/* ===================== Yo (perfil, listas, acceso) ===================== */
const mine = { tab: 'vistas', type: 'all', sort: 'reciente' };
function renderMe() {
  if (CLOUD && !user) return renderAuth();
  if (!D.profile) return go('editar');
  const p = D.profile, W = Object.entries(D.watched), A = Object.entries(D.want), F = Object.values(D.follows);
  const nm = W.filter(([k]) => k.startsWith('movie')).length;
  let body = '';
  if (mine.tab === 'actores') body = F.length ? `<div class="people">${F.sort((a, b) => b.at - a.at).map(f => personCard({ id: f.id, name: f.name, photo: f.photo })).join('')}</div>` : emptyBox('Todavía no seguís a nadie.', '<a class="btn" href="#actores">Buscar actores</a>');
  else {
    let l = (mine.tab === 'vistas' ? W : A).map(([k, v]) => (REG[k] = Object.assign(REG[k] || {}, v))).filter(v => mine.type === 'all' || v.type === mine.type);
    l.sort(mine.sort === 'titulo' ? (a, b) => a.title.localeCompare(b.title) : mine.sort === 'anio' ? (a, b) => (b.year || '').localeCompare(a.year || '') : mine.sort === 'puntaje' ? (a, b) => (b.rating || 0) - (a.rating || 0) : (a, b) => b.at - a.at);
    body = `<div class="tools"><div class="seg" id="mtype"><button data-v="all" aria-pressed="${mine.type === 'all'}">Todo</button><button data-v="movie" aria-pressed="${mine.type === 'movie'}">Pelis</button><button data-v="tv" aria-pressed="${mine.type === 'tv'}">Series</button></div>
    <label class="sr" for="msort">Ordenar</label><select id="msort" class="btn ghost small"><option value="reciente">Agregadas recién</option><option value="puntaje">Por mi puntaje</option><option value="titulo">Por título</option><option value="anio">Por año</option></select></div>` +
      (l.length ? `<div class="grid">${l.map(n => card(n, n.review ? `<small class="rv">“${esc(n.review)}”</small>` : '')).join('')}</div>` : emptyBox(mine.tab === 'vistas' ? 'Todavía no marcaste nada como visto. Tocá el ícono de cualquier portada.' : 'Tu lista “quiero ver” está vacía. Abrí una peli y tocá “Quiero verla”.'));
  }
  const localCount = Object.keys(L.watched).length + Object.keys(L.want).length;
  const link = location.origin + location.pathname + '#u-' + (p.username || '');
  app.innerHTML = `${CLOUD && D.cloudEmpty && localCount ? `<div class="banner"><span>Encontré <b>${localCount}</b> títulos guardados en este navegador. ¿Los paso a tu cuenta?</span><button class="btn small" id="imp">Importar</button></div>` : ''}
  <section class="profile">${myAvatar(140)}<div>
   <h2>${esc(pName(p))}</h2>${p.username ? `<div class="handle">@${esc(p.username)}${CLOUD ? ` · ${p.is_public ? 'Perfil público' : 'Perfil privado'}` : ''}</div>` : ''}
   ${p.bio ? `<p style="margin:8px 0 0">${esc(p.bio)}</p>` : ''}
   <div class="stats"><div class="stat"><b>${nm}</b><span>películas</span></div><div class="stat"><b>${W.length - nm}</b><span>series</span></div><div class="stat"><b>${A.length}</b><span>quiero ver</span></div><div class="stat"><b>${F.length}</b><span>actores</span></div></div>
   <div class="acts"><a class="btn small" href="#resumen">Mi resumen</a><a class="btn ghost small" href="#editar">Editar personaje y estilo</a>${CLOUD ? `<button class="btn ghost small" id="cpl">Copiar link de mi perfil</button><button class="btn ghost small" id="logout">Cerrar sesión</button>` : ''}</div></div></section>
  <div class="tools" style="margin-top:22px"><div class="seg" id="mtab"><button data-v="vistas" aria-pressed="${mine.tab === 'vistas'}">Vistas (${W.length})</button><button data-v="quiero" aria-pressed="${mine.tab === 'quiero'}">Quiero ver (${A.length})</button><button data-v="actores" aria-pressed="${mine.tab === 'actores'}">Actores (${F.length})</button></div></div>
  ${body}
  <details class="box" style="margin-top:40px"><summary><b>Ajustes y copia de seguridad</b></summary>
   <form id="setf"><label class="field"><span>País</span><small>Para “dónde verla”, la ruleta y los estrenos</small><select id="sr">${[['AR', 'Argentina'], ['UY', 'Uruguay'], ['CL', 'Chile'], ['MX', 'México'], ['ES', 'España'], ['CO', 'Colombia'], ['PE', 'Perú'], ['US', 'Estados Unidos']].map(r => `<option value="${r[0]}" ${L.region === r[0] ? 'selected' : ''}>${r[1]}</option>`).join('')}</select></label>
   <label class="field"><span>Idioma de títulos y sinopsis</span><select id="sl"><option value="es-MX">Español latino</option><option value="es-ES">Español de España</option><option value="en-US">Inglés</option></select></label>
   ${CLOUD ? '' : `<label class="field"><span>Clave de TMDB</span><input id="sk" value="${esc(L.key)}" autocomplete="off"></label>`}
   <div class="acts"><button class="btn">Guardar ajustes</button><button type="button" class="btn ghost" id="exp">Descargar copia</button>${CLOUD ? '' : '<label class="btn ghost">Cargar copia<input type="file" id="impf" accept=".json" hidden></label>'}</div><p class="err" id="serr"></p></form></details>`;
  $('#sl').value = L.lang;
  if ($('#msort')) { $('#msort').value = mine.sort; $('#msort').onchange = e => { mine.sort = e.target.value; renderMe(); }; }
  $('#mtab').onclick = e => { if (e.target.dataset.v) { mine.tab = e.target.dataset.v; renderMe(); } };
  if ($('#mtype')) $('#mtype').onclick = e => { if (e.target.dataset.v) { mine.type = e.target.dataset.v; renderMe(); } };
  if ($('#imp')) $('#imp').onclick = async () => { $('#imp').disabled = true; try { await importLocal(); renderMe(); } catch (e) { toast('No se pudo importar: ' + e.message); $('#imp').disabled = false; } };
  if ($('#logout')) $('#logout').onclick = async () => { await sb.auth.signOut(); toast('Sesión cerrada'); };
  if ($('#cpl')) $('#cpl').onclick = () => copyText(link, p.is_public ? 'Link copiado' : 'Link copiado. Tu perfil es privado: solo tus conexiones ven tus listas');
  $('#setf').onsubmit = async e => {
    e.preventDefault();
    try {
      if (!CLOUD) { const k = $('#sk').value.trim(); if (k !== L.key) { await api('configuration', {}, k); L.key = k; } }
      if (L.lang !== $('#sl').value) { L.cache = {}; L.meta = {}; ex.items = []; genreCache = {}; pp.items = []; }
      if (L.region !== $('#sr').value) provCache = null;
      L.region = $('#sr').value; L.lang = $('#sl').value; recsCache = null; for (const x in REG) delete REG[x]._d; saveL(); toast('Ajustes guardados');
    } catch (er) { $('#serr').textContent = er.message; }
  };
  $('#exp').onclick = () => {
    const b = new Blob([JSON.stringify({ watched: D.watched, want: D.want, follows: D.follows, profile: D.profile }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'micine-lista.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  };
  if ($('#impf')) $('#impf').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const d = JSON.parse(await f.text()); Object.assign(L.watched, d.watched || {}); Object.assign(L.want, d.want || {}); Object.assign(L.follows, d.follows || {}); if (d.profile && !L.profile) L.profile = d.profile; useLocal(); saveL(); recsCache = null; toast('Lista cargada'); renderShell(); renderMe(); }
    catch (er) { toast('Ese archivo no es una copia válida'); }
  };
}

let authMode = 'signup';
function renderAuth(msg = '') {
  const crowd = ['guerrera', 'vampiro', 'astronauta', 'detective', 'samurai', 'alien', 'heroe', 'fantasma'];
  app.innerHTML = `<section class="hello"><div>
    <h1>${authMode === 'signup' ? 'Creá tu personaje.' : 'Volviste a la sala.'}</h1>
    <p class="muted">${authMode === 'signup' ? 'Elegí tu avatar, tu estilo favorito y empezá a armar tu historial de pelis y series. Gratis.' : 'Entrá para ver tu lista, tus actores y tus recomendaciones.'}</p>
    <form class="box" id="authf">
      <div class="seg authtabs"><button type="button" data-m="signup" aria-pressed="${authMode === 'signup'}">Crear cuenta</button><button type="button" data-m="login" aria-pressed="${authMode === 'login'}">Ya tengo cuenta</button></div>
      <label class="field"><span>Email</span><input id="ae" type="email" autocomplete="email" required></label>
      <label class="field"><span>Contraseña</span><input id="ap" type="password" minlength="6" autocomplete="${authMode === 'signup' ? 'new-password' : 'current-password'}" required><small>Mínimo 6 caracteres.</small></label>
      <div class="acts"><button class="btn" id="asub">${authMode === 'signup' ? 'Crear cuenta' : 'Entrar'}</button>${authMode === 'login' ? '<button type="button" class="btn ghost" id="forgot">Olvidé mi contraseña</button>' : ''}</div>
      <p class="err" id="aerr">${esc(msg)}</p>
    </form></div>
    <div class="crowd" aria-hidden="true">${crowd.map((a, i) => avatarSVG(a, COLORS[(i + 3) % COLORS.length], SKINS[(i + 1) % 5], 120)).join('')}</div></section>`;
  $('#authf .authtabs').onclick = e => { const m = e.target.dataset.m; if (m && m !== authMode) { authMode = m; renderAuth(); } };
  const out = m => { $('#aerr').textContent = m; };
  $('#authf').onsubmit = async e => {
    e.preventDefault();
    const email = $('#ae').value.trim(), password = $('#ap').value;
    $('#asub').disabled = true; out('');
    try {
      if (authMode === 'signup') {
        const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
        if (error) throw error;
        if (!data.session) out('¡Listo! Te mandamos un mail para confirmar la cuenta. Después volvé y entrá.');
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (er) { out(authError(er)); }
    if ($('#asub')) $('#asub').disabled = false;
  };
  if ($('#forgot')) $('#forgot').onclick = async () => {
    const email = $('#ae').value.trim(); if (!email) return out('Escribí tu email y tocá de nuevo.');
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    out(error ? authError(error) : 'Te mandamos un mail para elegir una contraseña nueva.');
  };
}
function authError(e) {
  const m = (e && e.message) || '';
  if (/Invalid login credentials/i.test(m)) return 'Email o contraseña incorrectos.';
  if (/already registered/i.test(m)) return 'Ese email ya tiene cuenta. Tocá “Ya tengo cuenta”.';
  if (/Email not confirmed/i.test(m)) return 'Todavía no confirmaste tu email. Revisá tu correo.';
  if (/rate limit/i.test(m)) return 'Demasiados intentos. Esperá unos minutos.';
  if (/Password should be/i.test(m)) return 'La contraseña tiene que tener al menos 6 caracteres.';
  return m || 'Algo salió mal. Probá de nuevo.';
}
function renderNewPass() {
  app.innerHTML = `<h2 class="sec">Elegí una contraseña nueva</h2><form class="box" id="npf" style="max-width:480px"><label class="field"><span>Contraseña nueva</span><input id="np" type="password" minlength="6" autocomplete="new-password" required></label><button class="btn">Guardar</button><p class="err" id="nperr"></p></form>`;
  $('#npf').onsubmit = async e => { e.preventDefault(); const { error } = await sb.auth.updateUser({ password: $('#np').value }); if (error) $('#nperr').textContent = authError(error); else { toast('Contraseña actualizada'); go('yo'); } };
}

/* ===================== Editor de personaje y estilo ===================== */
async function renderEditor() {
  if (CLOUD && !user) return go('yo');
  const first = !D.profile;
  const p = { username: '', display_name: '', avatar: 'cinefilo', color: COLORS[0], theme: curTheme(), bio: '', fav_genres: [], is_public: false, prefs: { skin: SKINS[0] }, ...(D.profile || {}) };
  p.prefs = { skin: SKINS[0], ...(p.prefs || {}) };
  const gl = await genres('movie');
  const draw = () => {
    const t = THEMES[p.theme];
    app.innerHTML = `<div class="editor">
    <div><h2 class="sec">${first ? 'Creá tu personaje' : 'Tu personaje'}</h2><p class="muted">${first ? 'Así te van a ver en MiCine. Lo podés cambiar cuando quieras.' : 'Cambiá tu avatar, tus datos y el estilo de la app.'}</p></div>
    <section class="box"><div class="preview">${avatarSVG(p.avatar, p.color, p.prefs.skin, 84)}<div><b style="font-size:20px">${esc(p.display_name || 'Tu nombre')}</b><div class="muted">@${esc(p.username || 'usuario')}</div></div></div>
     <h3 style="margin-top:18px">Elegí tu personaje</h3><div class="avpick" id="avp">${AVATARS.map(a => `<button type="button" data-av="${a.id}" aria-pressed="${p.avatar === a.id}">${avatarSVG(a.id, p.color, p.prefs.skin, 58)}${esc(a.name)}</button>`).join('')}</div>
     <h3 style="margin-top:18px">Color de fondo</h3><div class="swatches" id="colp">${COLORS.map(c => `<button type="button" data-c="${c}" style="background:${c}" aria-label="Color ${c}" aria-pressed="${p.color === c}"></button>`).join('')}</div>
     <h3 style="margin-top:18px">Tono de piel</h3><div class="swatches" id="skp">${SKINS.map(c => `<button type="button" data-s="${c}" style="background:${c}" aria-label="Tono ${c}" aria-pressed="${p.prefs.skin === c}"></button>`).join('')}</div></section>
    <section class="box"><h3>Tus datos</h3>
     <label class="field"><span>Nombre visible</span><input id="fn" maxlength="40" value="${esc(p.display_name)}" placeholder="Ej: Juampi"></label>
     <label class="field"><span>Nombre de usuario</span><input id="fu" maxlength="20" value="${esc(p.username)}" placeholder="ej: juampi_cine" autocapitalize="none" autocomplete="username" ${CLOUD ? 'required' : ''}><small>Minúsculas, números y guion bajo (3 a 20). Con este nombre te encuentran para conectarse.</small></label>
     <label class="field"><span>Bio</span><textarea id="fb" maxlength="200" placeholder="Fan de las sagas largas y los finales que no se ven venir.">${esc(p.bio)}</textarea></label>
     ${CLOUD ? `<label class="chk big"><input type="checkbox" id="fpub" ${p.is_public ? 'checked' : ''}> <span><b>Perfil público</b><br>Cualquiera con tu link ve lo que viste y tus puntajes. Si lo dejás privado, solo lo ven las personas con las que te conectes.</span></label>` : ''}
     <h3 style="margin-top:14px">Géneros favoritos</h3><div class="chips" id="gp" style="flex-wrap:wrap">${gl.map(g => `<button type="button" data-g="${g.id}" aria-pressed="${p.fav_genres.includes(g.id)}">${esc(g.name)}</button>`).join('')}</div></section>
    <section class="box"><h3>Estilo de la app</h3><p class="muted" style="margin-top:-4px">Cambia colores, tipografía, íconos y fondo. Tocá uno para probarlo.</p>
     <div class="themes" id="thp">${Object.entries(THEMES).map(([id, th]) => `<button type="button" class="themecard" data-th="${id}" aria-pressed="${p.theme === id}" style="background:${th.c.bg} ${th.pattern};background-size:${th.patternSize || 'auto'};color:${th.c.ink}"><div class="tp"><span style="color:${th.c.acc}">${icon(th.mark, 30)}</span><b style="font-family:${esc(th.font)}">${esc(th.name)}</b></div><div class="dots"><i style="background:${th.c.acc}"></i><i style="background:${th.c.acc2}"></i><i style="background:${th.c.panel}"></i></div></button>`).join('')}</div>
     <p class="muted" style="margin-bottom:0">Estilo elegido: <b>${esc(t.name)}</b> · “${esc(t.loading)}”</p></section>
    <div class="stickybar"><span class="err" id="perr" style="margin-right:auto;align-self:center"></span>${first ? '' : '<a class="btn ghost" href="#yo" id="pcancel">Cancelar</a>'}<button class="btn" id="psave">${first ? 'Crear mi personaje' : 'Guardar cambios'}</button></div></div>`;
    const keep = () => { p.display_name = $('#fn').value; p.username = $('#fu').value.toLowerCase().replace(/[^a-z0-9_]/g, ''); p.bio = $('#fb').value; if ($('#fpub')) p.is_public = $('#fpub').checked; };
    $('#avp').onclick = e => { const b = e.target.closest('[data-av]'); if (b) { keep(); p.avatar = b.dataset.av; draw(); } };
    $('#colp').onclick = e => { const b = e.target.closest('[data-c]'); if (b) { keep(); p.color = b.dataset.c; draw(); } };
    $('#skp').onclick = e => { const b = e.target.closest('[data-s]'); if (b) { keep(); p.prefs.skin = b.dataset.s; draw(); } };
    $('#gp').onclick = e => { const b = e.target.closest('[data-g]'); if (!b) return; const g = +b.dataset.g; p.fav_genres = p.fav_genres.includes(g) ? p.fav_genres.filter(x => x !== g) : [...p.fav_genres, g]; b.setAttribute('aria-pressed', p.fav_genres.includes(g)); };
    $('#thp').onclick = e => { const b = e.target.closest('[data-th]'); if (b) { keep(); p.theme = b.dataset.th; applyTheme(p.theme); draw(); } };
    $('#fu').oninput = e => { const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''); if (v !== e.target.value) e.target.value = v; };
    $('#psave').onclick = async () => {
      keep();
      if (CLOUD && !/^[a-z0-9_]{3,20}$/.test(p.username)) { $('#perr').textContent = 'Elegí un nombre de usuario (3 a 20 caracteres).'; $('#fu').focus(); return; }
      if (!CLOUD && p.username && !/^[a-z0-9_]{3,20}$/.test(p.username)) { $('#perr').textContent = 'El usuario debe tener de 3 a 20 caracteres.'; return; }
      $('#psave').disabled = true; $('#perr').textContent = '';
      try {
        const data = { username: p.username || 'yo', display_name: p.display_name.trim() || p.username || 'Cinéfilo', avatar: p.avatar, color: p.color, theme: p.theme, bio: p.bio.trim(), fav_genres: p.fav_genres, prefs: p.prefs };
        if (CLOUD) data.is_public = !!p.is_public;
        await saveProfile(data);
        recsCache = null; renderShell(); toast(first ? '¡Bienvenido a MiCine!' : 'Perfil guardado'); go(first ? 'explorar' : 'yo');
      } catch (er) { $('#perr').textContent = er.message; $('#psave').disabled = false; }
    };
  };
  draw();
}

/* ===================== Ficha (modal) ===================== */
let openKey = null, castOpen = false;
async function openDetail(k, silent) {
  const n = REG[k] || D.watched[k] || D.want[k]; if (!n) return; REG[k] = n;
  if (!silent) castOpen = false;
  const prevKey = openKey; openKey = k;
  const m = $('#modal'), sh = $('#sheet');
  if (!silent) { m.classList.add('open'); document.body.style.overflow = 'hidden'; sh.innerHTML = `<button class="close" data-close aria-label="Cerrar">✕</button><div class="hero"></div>${spinner()}`; if (!history.state || !history.state.modal) history.pushState({ modal: 1 }, ''); }
  let d = n._d;
  if (!d) { try { d = await api(`${n.type}/${n.id}`, { append_to_response: `${n.type === 'tv' ? 'aggregate_credits' : 'credits'},recommendations,watch/providers` }); n._d = d; if (d.genres) n.g = d.genres.map(g => g.id); } catch (e) { sh.innerHTML = `<button class="close" data-close aria-label="Cerrar">✕</button><p class="err" style="padding:30px">${esc(e.message)}</p>`; return; } }
  if (openKey !== k) return;
  const keepScroll = silent && prevKey === k ? m.scrollTop : 0;
  const t = T(), w = D.watched[k], wa = D.want[k];
  const dur = n.type === 'movie' ? (d.runtime ? `${Math.floor(d.runtime / 60)} h ${d.runtime % 60} min` : '') : `${d.number_of_seasons || '?'} temporada${d.number_of_seasons === 1 ? '' : 's'}`;
  const pv = (d['watch/providers']?.results || {})[L.region] || {};
  const provs = [...(pv.flatrate || []), ...(pv.free || []), ...(pv.ads || [])];
  const rent = [...(pv.rent || []), ...(pv.buy || [])].filter((p, i, a) => a.findIndex(q => q.provider_id === p.provider_id) === i);
  const recs = (d.recommendations?.results || []).slice(0, 14).map(r => norm(r, n.type));
  const castAll = (n.type === 'tv' ? d.aggregate_credits?.cast?.map(c => ({ ...c, character: (c.roles || []).map(r => r.character).filter(Boolean).join(' / ') })) : d.credits?.cast) || [];
  const dir = (d.credits?.crew || []).filter(c => c.job === 'Director').slice(0, 2);
  const creators = d.created_by || [];
  const acc = CLOUD && user ? accepted() : [];
  const castBtn = c => `<button data-person="${c.id}" data-close><div class="face">${c.profile_path ? `<img loading="lazy" src="${img(c.profile_path, 'w185')}" alt="">` : esc(c.name.slice(0, 1))}</div><b>${esc(c.name)}</b>${c.character ? `<small>${esc(c.character)}</small>` : ''}${D.follows[c.id] ? '<small class="why">Lo seguís</small>' : ''}</button>`;
  sh.innerHTML = `<button class="close" data-close aria-label="Cerrar">✕</button>
  <div class="hero" style="background-image:url('${img(d.backdrop_path, 'w1280')}')"></div>
  <div class="dbody"><div class="dposter"><div class="poster" style="cursor:default">${n.poster ? `<img src="${img(n.poster, 'w500')}" alt="">` : `<span>${esc(n.title)}</span>`}</div></div>
  <div class="dinfo"><h2>${esc(d.title || d.name)}</h2>
   ${(d.original_title || d.original_name) !== (d.title || d.name) ? `<div class="muted">${esc(d.original_title || d.original_name)}</div>` : ''}
   <div class="facts">${[n.year, n.type === 'tv' ? 'Serie' : 'Película', dur, (d.genres || []).map(g => g.name).join(', '), d.vote_average ? `★ ${d.vote_average.toFixed(1)} en TMDB` : ''].filter(Boolean).map(esc).join(' · ')}</div>
   <div class="acts"><button class="btn${w ? ' on' : ''}" data-tick="${k}">${icon(t.mark, 20)}${w ? 'Ya la vi' : 'Marcar como vista'}</button>
   ${w ? '' : `<button class="btn ghost" data-want="${k}">${icon(t.want, 20)}${wa ? 'En “quiero ver”' : 'Quiero verla'}</button>`}
   ${d.belongs_to_collection ? `<a class="btn ghost" href="#saga-col${d.belongs_to_collection.id}" data-close>Ver saga: ${esc(d.belongs_to_collection.name)}</a>` : ''}</div>
   ${acc.length ? acc.map(c => { const s = (D.cpl[c.id] || {})[k]?.status; return `<div class="together">${pAvatar(c.other, 30)}<span>Con ${esc(pName(c.other))}:</span><button class="chipbtn" data-cpl="${c.id}|watched" aria-pressed="${s === 'watched'}">La vimos juntos</button><button class="chipbtn" data-cpl="${c.id}|want" aria-pressed="${s === 'want'}">Queremos verla</button></div>`; }).join('') : ''}
   <p>${esc(d.overview || 'Sin sinopsis en español todavía.')}</p>
   ${dir.length ? `<p><b>Dirección:</b> ${dir.map(c => `<a href="#actor-${c.id}" data-close>${esc(c.name)}</a>`).join(', ')}</p>` : ''}
   ${creators.length ? `<p><b>Creada por:</b> ${creators.map(c => `<a href="#actor-${c.id}" data-close>${esc(c.name)}</a>`).join(', ')}</p>` : ''}
   ${d.tagline ? `<p class="muted"><i>${esc(d.tagline)}</i></p>` : ''}
  </div>
  ${w ? `<div class="full box rate"><h3>Tu opinión</h3>
    <div class="starpick" id="stp" role="radiogroup" aria-label="Tu puntaje">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-st="${i}" aria-pressed="${i <= (w.rating || 0)}" aria-label="${i} estrella${i > 1 ? 's' : ''}">${icon(STAR, 34)}</button>`).join('')}<span class="muted" id="stl">${w.rating ? ['', 'No me gustó', 'Flojita', 'Está bien', 'Muy buena', '¡Me encantó!'][w.rating] : 'Tocá para puntuar'}</span></div>
    <label class="field"><span>Tu reseña (opcional)</span><textarea id="rvw" maxlength="500" placeholder="¿Qué te pareció? Una frase alcanza.">${esc(w.review || '')}</textarea></label>
    <div class="tools" style="margin:0 0 12px"><label class="field" style="margin:0"><span>La vi el</span><input type="date" id="wdt" value="${w.watched_on || ''}" max="${today()}" ${w.watched_on === null ? 'disabled' : ''}></label><label class="chk"><input type="checkbox" id="wnull" ${w.watched_on === null ? 'checked' : ''}> No me acuerdo cuándo</label></div>
    <button class="btn" id="rsave">Guardar opinión</button> <small class="muted">Tus puntajes mejoran las recomendaciones.</small></div>` : ''}
  <div class="full"><h3>Dónde verla</h3>
   ${provs.length ? `<div class="provs">${provs.map(p => `<img src="${img(p.logo_path, 'w92')}" alt="${esc(p.provider_name)}" title="${esc(p.provider_name)}">`).join('')}</div>` : '<p class="muted">No figura en plataformas de suscripción en tu país.</p>'}
   ${rent.length ? `<p class="muted" style="margin-top:8px">Alquiler o compra: ${esc(rent.map(p => p.provider_name).join(', '))}</p>` : ''}
   ${pv.link ? `<p><a href="${esc(pv.link)}" target="_blank" rel="noopener">Ver todas las opciones</a></p>` : ''}</div>
  ${castAll.length ? `<div class="full"><h3>Reparto</h3>
   ${castOpen ? `<div class="search" style="margin-bottom:12px">${icon(SEARCH, 20)}<input id="castq" type="search" placeholder="Buscar actor o personaje (ej: Thor)" aria-label="Buscar en el reparto"></div><div class="castgrid" id="castgrid">${castAll.map(castBtn).join('')}</div>`
      : `<div class="castrow">${castAll.slice(0, 14).map(castBtn).join('')}</div>${castAll.length > 14 ? `<button class="btn ghost small" id="castall">Ver reparto completo (${castAll.length})</button>` : ''}`}</div>` : ''}
  ${recs.length ? `<div class="full"><h3>Si te gustó, mirá</h3><div class="hrow">${recs.map(r => card(r)).join('')}</div></div>` : ''}
  </div>`;
  if (keepScroll) m.scrollTop = keepScroll;
  const ca = $('#castall'); if (ca) ca.onclick = () => { castOpen = true; openDetail(k, true).then(() => $('#castq')?.focus()); };
  const cq = $('#castq'); if (cq) cq.oninput = () => { const q = fold(cq.value); $('#castgrid').innerHTML = castAll.filter(c => !q || fold(c.name + ' ' + (c.character || '')).includes(q)).map(castBtn).join('') || '<p class="muted">Nadie coincide.</p>'; };
  if (w) {
    let r = w.rating || 0;
    const labels = ['Tocá para puntuar', 'No me gustó', 'Flojita', 'Está bien', 'Muy buena', '¡Me encantó!'];
    $('#stp').onclick = e => { const b = e.target.closest('[data-st]'); if (!b) return; const v = +b.dataset.st; r = r === v ? 0 : v; $('#stp').querySelectorAll('[data-st]').forEach(x => x.setAttribute('aria-pressed', +x.dataset.st <= r)); $('#stl').textContent = labels[r]; };
    $('#wnull').onchange = e => { $('#wdt').disabled = e.target.checked; };
    $('#rsave').onclick = async () => {
      const wo = $('#wnull').checked ? null : ($('#wdt').value || today());
      $('#rsave').disabled = true;
      await saveReview(k, { rating: r || null, review: $('#rvw').value.trim(), watched_on: wo });
      toast(r ? `Guardado: ${r} ★` : 'Guardado'); $('#rsave').disabled = false;
      if (view === 'yo' || view === 'resumen' || view === 'sagas') render(); else refreshCardStars(k);
    };
  }
}
function refreshCardStars(k) {
  document.querySelectorAll(`.card[data-k="${CSS.escape(k)}"] .meta`).forEach(m => { m.querySelector('.stars-s')?.remove(); const w = D.watched[k]; if (w && w.rating) m.querySelector('small').insertAdjacentHTML('afterend', stars(w.rating)); });
}
function closeDetail(fromPop) {
  if (!openKey && !$('#modal').classList.contains('open')) return;
  openKey = null; $('#modal').classList.remove('open'); document.body.style.overflow = '';
  if (!fromPop && history.state && history.state.modal) history.back();
}

/* ===================== Eventos ===================== */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-tick],[data-open],[data-want],[data-follow],[data-person],[data-close],[data-cpl],[data-accept],[data-remove],[data-invite],[data-addj],[data-jtab]');
  if (!t) { if (e.target.id === 'modal') closeDetail(); return; }
  if (t.dataset.tick) { e.preventDefault(); toggleWatched(t.dataset.tick); }
  else if (t.dataset.want) toggleWant(t.dataset.want);
  else if (t.dataset.open) { e.preventDefault(); openDetail(t.dataset.open); }
  else if (t.dataset.follow) toggleFollow({ id: t.dataset.follow, name: t.dataset.name, photo: t.dataset.photo });
  else if (t.dataset.person) { closeDetail(true); go('actor-' + t.dataset.person); }
  else if (t.dataset.cpl) { const [cid, st] = t.dataset.cpl.split('|'); toggleCouple(cid, openKey, st); }
  else if (t.dataset.addj) { const [cid, k] = t.dataset.addj.split('|'); addTogether(cid, [k], !inTogether(cid, k)); }
  else if (t.dataset.jtab) { jtab.tab = t.dataset.jtab; render(); }
  else if (t.dataset.accept) connAction('accept', t.dataset.accept);
  else if (t.dataset.remove) { if (confirm('¿Seguro? Se borra también la lista en común.')) connAction('remove', t.dataset.remove); }
  else if (t.dataset.invite) invite(t.dataset.invite).then(() => { toast('Invitación enviada'); render(); }, er => toast(er.message));
  else if (t.dataset.close !== undefined) { const href = t.getAttribute('href'); if (href) { e.preventDefault(); closeDetail(true); go(href.slice(1)); } else closeDetail(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modal').classList.contains('open')) closeDetail(); });
addEventListener('popstate', () => { if ($('#modal').classList.contains('open')) closeDetail(true); });
addEventListener('hashchange', () => { if ($('#modal').classList.contains('open')) closeDetail(true); route(); scrollTo(0, 0); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && CLOUD && user) loadConns().catch(() => {}); });

/* ===================== Arranque ===================== */
async function boot() {
  if (CLOUD && sb) {
    const { data } = await sb.auth.getSession();
    user = data.session?.user || null;
    if (user) { try { await loadCloud(); } catch (e) { console.error(e); } }
    sb.auth.onAuthStateChange((ev, session) => {
      setTimeout(async () => {
        if (ev === 'PASSWORD_RECOVERY') { user = session?.user || user; go('nueva-clave'); return; }
        const u = session?.user || null;
        if ((u && u.id) === (user && user.id)) return;
        user = u;
        if (user) { try { await loadCloud(); } catch (e) { console.error(e); } }
        else { D.watched = {}; D.want = {}; D.follows = {}; D.profile = null; D.conns = []; D.cpl = {}; D.plib = {}; }
        recsCache = null; coupleRecs = {}; applyTheme(curTheme()); renderShell();
        go(user ? (D.profile ? 'explorar' : 'editar') : 'explorar');
      }, 0);
    });
  } else useLocal();
  applyTheme(curTheme());
  renderShell();
  route();
}
if (CLOUD && !sb) app.innerHTML = '<p class="err">No se pudo cargar el sistema de cuentas. Revisá tu conexión y recargá la página.</p>';
else boot();
