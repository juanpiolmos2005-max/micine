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
const L = { key: '', region: 'AR', lang: 'es-MX', cache: {}, order: {}, series: {}, theme: 'cine', watched: {}, want: {}, follows: {}, profile: null };
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
L.migrated = 1;
const saveL = () => { try { localStorage.setItem(LS, JSON.stringify(L)); } catch (e) {} };
saveL();

let user = null;
const D = { watched: {}, want: {}, follows: {}, profile: null, cloudEmpty: false };
function useLocal() { D.watched = L.watched; D.want = L.want; D.follows = L.follows; D.profile = L.profile; }

const REG = {};
const $ = s => document.querySelector(s);
const app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const img = (p, sz = 'w342') => p ? `https://image.tmdb.org/t/p/${sz}${p}` : '';
const kOf = n => n.type + ':' + n.id;
const T = () => THEMES[curTheme()] || THEMES.cine;
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400); }
const spinner = (txt) => `<div class="spin">${icon(T().mark, 34)}${esc(txt || T().loading)}</div>`;
const emptyBox = (txt, extra = '') => `<div class="empty">${icon(T().mark, 40)}<p>${txt}</p>${extra}</div>`;

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

/* ===================== TMDB ===================== */
async function api(path, params = {}, keyOverride) {
  const qs = new URLSearchParams({ language: L.lang });
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  let url, h = { accept: 'application/json' };
  if (CLOUD) {
    qs.set('path', path);
    url = `${CFG.supabaseUrl}/functions/v1/tmdb?${qs}`;
  } else {
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
function norm(r, type) {
  const t = r.media_type || type;
  const n = { id: r.id, type: t, title: r.title || r.name || 'Sin título', year: (r.release_date || r.first_air_date || '').slice(0, 4), poster: r.poster_path || null, vote: r.vote_average || 0 };
  const k = t + ':' + r.id; REG[k] = Object.assign(REG[k] || {}, n); return REG[k];
}
let genreCache = {};
async function genres(type) { if (!genreCache[type]) { try { genreCache[type] = (await api(`genre/${type}/list`)).genres; } catch (e) { return []; } } return genreCache[type]; }

/* ===================== Datos del usuario ===================== */
const needsAccount = () => CLOUD && !user;
function askAccount(msg) { toast(msg || 'Creá tu cuenta para guardar tu lista'); go('yo'); }

async function loadCloud() {
  const [p, lib, fol] = await Promise.all([
    sb.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    sb.from('library').select('*').order('created_at', { ascending: false }).limit(5000),
    sb.from('followed_people').select('*'),
  ]);
  if (p.error) console.warn(p.error);
  D.profile = p.data || null;
  D.watched = {}; D.want = {}; D.follows = {};
  for (const r of lib.data || []) (r.status === 'watched' ? D.watched : D.want)[r.media_key] = { id: r.tmdb_id, type: r.media_type, title: r.title, poster: r.poster, year: r.year, vote: r.vote, at: Date.parse(r.created_at) };
  for (const f of fol.data || []) D.follows[f.person_id] = { id: f.person_id, name: f.name, photo: f.profile_path, at: Date.parse(f.created_at) };
  D.cloudEmpty = !(lib.data || []).length;
}
function cloudErr(r) { if (r && r.error) { console.error(r.error); toast('No se pudo guardar: revisá tu conexión'); } }

function setStatus(k, status) {
  const n = REG[k] || D.watched[k] || D.want[k];
  if (!n) return false;
  if (needsAccount()) { askAccount(); return false; }
  const rec = { id: n.id, type: n.type, title: n.title, year: n.year || '', poster: n.poster || null, vote: n.vote || 0, at: Date.now() };
  delete D.watched[k]; delete D.want[k];
  if (status) D[status === 'watched' ? 'watched' : 'want'][k] = rec;
  if (CLOUD) {
    const q = status
      ? sb.from('library').upsert({ user_id: user.id, media_key: k, status, tmdb_id: rec.id, media_type: rec.type, title: rec.title, poster: rec.poster, year: rec.year, vote: rec.vote })
      : sb.from('library').delete().eq('user_id', user.id).eq('media_key', k);
    q.then(cloudErr);
  } else saveL();
  recsCache = null;
  return true;
}
function toggleWatched(k) {
  const was = !!D.watched[k];
  if (!setStatus(k, was ? null : 'watched')) return;
  toast(was ? 'Quitada de vistas' : `${REG[k]?.title || 'Marcada'}: ¡vista!`);
  refresh();
}
function toggleWant(k) { if (setStatus(k, D.want[k] ? null : 'want')) refresh(); }

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
  recsCache = null;
  document.querySelectorAll(`[data-follow="${id}"]`).forEach(b => { const on = !!D.follows[id]; b.setAttribute('aria-pressed', on); b.textContent = on ? 'Siguiendo' : 'Seguir'; if (b.classList.contains('btn')) b.classList.toggle('on', on); });
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
  const data = rows.filter(([k]) => /^(movie|tv):\d+$/.test(k)).map(([k, s, v]) => ({ user_id: user.id, media_key: k, status: s, tmdb_id: v.id, media_type: v.type, title: v.title || 'Sin título', poster: v.poster || null, year: v.year || '', vote: v.vote || 0 }));
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
  <div class="meta"><b>${esc(n.title)}</b><small>${n.year || '—'} · ${n.type === 'tv' ? 'Serie' : 'Película'}${n.vote ? ` · ★ ${(+n.vote).toFixed(1)}` : ''}</small>${extra}</div></article>`;
}
function personCard(p, sub = '') {
  const on = !!D.follows[p.id];
  return `<div class="person"><button class="face" data-person="${p.id}" aria-label="${esc(p.name)}">${p.photo ? `<img loading="lazy" src="${img(p.photo, 'w185')}" alt="">` : `<span>${esc(p.name.slice(0, 1))}</span>`}</button>
  <b>${esc(p.name)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}
  <button class="follow" data-follow="${p.id}" data-name="${esc(p.name)}" data-photo="${esc(p.photo || '')}" aria-pressed="${on}">${on ? 'Siguiendo' : 'Seguir'}</button></div>`;
}
function myAvatar(size = 36) {
  const p = D.profile || {};
  return avatarSVG(p.avatar || 'cinefilo', p.color || T().c.acc, (p.prefs && p.prefs.skin) || SKINS[0], size);
}

/* ===================== Navegación ===================== */
const NAV = [
  ['explorar', 'Explorar', { d: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM15.5 8.5l-2 5-5 2 2-5z' }],
  ['sagas', 'Sagas', { d: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5' }],
  ['parati', 'Para vos', null],
  ['actores', 'Actores', { d: 'M9 11a4 4 0 1 0 0-8a4 4 0 1 0 0 8zM2 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5M18.5 7.5l1.1 2.2 2.4.3-1.8 1.6.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.6 2.4-.3z' }],
];
function renderShell() {
  const ic = it => icon(it[2] || T().mark, 22);
  const hasUser = !!D.profile && (!CLOUD || user);
  $('#navTop').innerHTML = NAV.map(it => `<a href="#${it[0]}" data-nav="${it[0]}">${ic(it)}${it[1]}</a>`).join('');
  $('#tabbar').innerHTML = NAV.map(it => `<a href="#${it[0]}" data-nav="${it[0]}">${ic(it)}${it[1]}</a>`).join('') +
    `<a href="#yo" data-nav="yo">${hasUser ? myAvatar(26) : icon({ d: 'M12 12a4.5 4.5 0 1 0 0-9a4.5 4.5 0 1 0 0 9zM3.5 21c0-4.5 3.8-7 8.5-7s8.5 2.5 8.5 7' }, 22)}${hasUser ? 'Yo' : (CLOUD ? 'Entrar' : 'Perfil')}</a>`;
  const me = $('#meBtn');
  me.classList.toggle('guest', !hasUser);
  me.innerHTML = hasUser ? `<span>${esc(D.profile.display_name || D.profile.username || 'Yo')}</span>${myAvatar(36)}` : (CLOUD ? 'Entrar' : 'Crear personaje');
  $('#logoMark').innerHTML = icon(T().mark, 22);
  markNav();
}
function markNav() {
  const v = view === 'actor' ? 'actores' : (view === 'editar' ? 'yo' : view);
  document.querySelectorAll('[data-nav]').forEach(a => a.dataset.nav === v ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
}
let view = 'explorar', arg = null;
const go = h => { if (location.hash.slice(1) === h) route(); else location.hash = h; };
function route() {
  const h = decodeURIComponent(location.hash.slice(1));
  arg = null;
  if (h.startsWith('saga-')) { view = 'sagas'; arg = h.slice(5); }
  else if (h.startsWith('actor-')) { view = 'actor'; arg = +h.slice(6); }
  else view = ['explorar', 'sagas', 'parati', 'actores', 'yo', 'editar', 'nueva-clave'].includes(h) ? h : 'explorar';
  if (view !== 'editar') applyTheme(curTheme());
  markNav();
  render();
}
function render() {
  if (!CLOUD && !L.key && view !== 'editar') return renderHello();
  if (CLOUD && user && !D.profile && view !== 'editar' && view !== 'nueva-clave') { location.replace('#editar'); return; }
  ({ explorar: renderExplore, sagas: renderSagas, parati: renderRecs, actores: renderPeople, actor: renderActor, yo: renderMe, editar: renderEditor, 'nueva-clave': renderNewPass })[view]();
}
function refresh() {
  if (view === 'explorar' || view === 'parati' || view === 'actor') {
    document.querySelectorAll('.card[data-k]').forEach(el => {
      const k = el.dataset.k, w = !!D.watched[k];
      el.classList.toggle('seen', w);
      const tk = el.querySelector('.tick'); tk.setAttribute('aria-pressed', w);
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
  app.innerHTML = `${CLOUD && !user ? `<div class="banner"><span><b>Creá tu personaje</b> para guardar lo que viste, seguir actores y recibir recomendaciones.</span><a class="btn small" href="#yo">Crear cuenta</a></div>` : ''}
  <h2 class="sec">${p ? `Hola, ${esc(p.display_name || p.username)}` : 'Explorar'}</h2>
  <form class="tools" id="sform" role="search"><div class="search">${icon({ d: 'M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13zM15.5 15.5 21 21' }, 20)}<input id="q" type="search" enterkeyhint="search" placeholder="Buscar cualquier película o serie…" value="${esc(ex.q)}" aria-label="Buscar"></div>
  <div class="seg" id="tseg"><button type="button" data-t="movie">Películas</button><button type="button" data-t="tv">Series</button></div>
  <label class="chk"><input type="checkbox" id="hide"> Ocultar las que ya vi</label></form>
  <div class="chips" id="modes"></div><div class="chips" id="gchips"></div><div id="exres" style="margin-top:14px"></div>`;
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

/* ===================== Sagas ===================== */
const ckey = it => it[0] + '|' + it[1] + '|' + it[2];
async function resolveItem(it) {
  const ck = ckey(it); if (L.cache[ck]) return L.cache[ck];
  const type = it[0] === 't' ? 'tv' : 'movie', yk = type === 'tv' ? 'first_air_date_year' : 'primary_release_year';
  try {
    let d = await api(`search/${type}`, { query: it[1], [yk]: it[2] });
    if (!d.results.length) d = await api(`search/${type}`, { query: it[1] });
    const r = d.results[0]; if (!r) return null;
    const n = norm(r, type);
    L.cache[ck] = { id: n.id, type, title: n.title, year: n.year || String(it[2]), poster: n.poster, vote: n.vote };
    return L.cache[ck];
  } catch (e) { return null; }
}
async function resolveSaga(s) {
  const todo = s.items.filter(it => !L.cache[ckey(it)]);
  for (let i = 0; i < todo.length; i += 6) await Promise.all(todo.slice(i, i + 6).map(resolveItem));
  if (todo.length) saveL();
}
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
  <div><b>${esc(n ? n.title : title)}${isNext ? '<span class="tag">Sigue</span>' : ''}</b><small>${sub}</small></div>
  ${n ? `<button class="tick" data-tick="${k}" aria-pressed="${!!seen}" aria-label="Marcar como vista">${icon(T().mark, 20)}</button>` : '<span></span>'}</li>`;
}
function renderSagas() {
  if (arg && arg.startsWith('col')) return renderCollection(+arg.slice(3));
  const s = SAGAS.find(x => x.id === arg);
  if (s) return renderSaga(s);
  app.innerHTML = `<h2 class="sec">Sagas y universos</h2><p class="muted">Elegí una saga para verla en orden, tildar lo que ya viste y saber qué sigue.</p>
  <div class="sagas" style="margin-top:16px">${SAGAS.map(s => {
    const l = sagaList(s, 'crono', L.series[s.id] !== false), w = l.filter(isW).length;
    return `<a class="saga" href="#saga-${s.id}" style="--c1:${s.c1};--c2:${s.c2};text-decoration:none"><h3>${esc(s.name)}</h3><div><small>${w} de ${l.length} vistas</small><div class="prog"><i style="width:${l.length ? w / l.length * 100 : 0}%"></i></div></div></a>`;
  }).join('')}</div>
  <h3 class="row-t">Buscar otra saga</h3>
  <p class="muted">TMDB agrupa miles de colecciones: Rocky, James Bond, Shrek, Volver al futuro, El Padrino…</p>
  <form class="tools" id="colform"><div class="search"><input id="colq" enterkeyhint="search" placeholder="Ej: Rocky, Matrix, Shrek…" aria-label="Buscar saga"></div><button class="btn">Buscar</button></form><div id="colres"></div>`;
  $('#colform').onsubmit = async e => {
    e.preventDefault(); const q = $('#colq').value.trim(); if (!q) return; $('#colq').blur();
    $('#colres').innerHTML = spinner();
    try {
      const d = await api('search/collection', { query: q });
      $('#colres').innerHTML = d.results.length ? `<div class="grid">${d.results.slice(0, 18).map(c => `<div class="card"><a class="poster" href="#saga-col${c.id}">${c.poster_path ? `<img loading="lazy" src="${img(c.poster_path)}" alt="">` : `<span>${esc(c.name)}</span>`}</a><div class="meta"><b>${esc(c.name)}</b></div></div>`).join('')}</div>` : emptyBox('No encontré colecciones con ese nombre.');
    } catch (er) { $('#colres').innerHTML = `<p class="err">${esc(er.message)}</p>`; }
  };
}
async function renderSaga(s) {
  const mode = L.order[s.id] || 'crono', ws = L.series[s.id] !== false, hasTv = s.items.some(i => i[0] === 't');
  const draw = () => {
    const l = sagaList(s, mode, ws), nextI = l.findIndex(x => x.n && !isW(x)), w = l.filter(isW).length;
    app.innerHTML = `<a class="back" href="#sagas">← Todas las sagas</a>
    <h2 class="sec">${esc(s.name)}</h2><p class="muted">${w} de ${l.length} vistas</p>
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
    app.innerHTML = `<a class="back" href="#sagas">← Todas las sagas</a><h2 class="sec">${esc(c.name)}</h2>
    <p class="muted">${parts.filter(n => D.watched[kOf(n)]).length} de ${parts.length} vistas · orden de estreno</p>${c.overview ? `<p class="note">${esc(c.overview)}</p>` : ''}
    <ol class="order">${parts.map((n, i) => row(i, n, n.title, n.year || 'Próximamente', i === nextI)).join('')}</ol>`;
  } catch (e) { app.innerHTML = `<a class="back" href="#sagas">← Volver</a><p class="err">${esc(e.message)}</p>`; }
}

/* ===================== Actores ===================== */
const pp = { q: '', items: [], loading: false, err: '' };
async function renderPeople() {
  const fol = Object.values(D.follows).sort((a, b) => b.at - a.at);
  app.innerHTML = `<h2 class="sec">Actores</h2><p class="muted">Seguí a tus actores y actrices favoritos: te aviso de sus pelis y series en “Para vos”.</p>
  <form class="tools" id="pform" role="search"><div class="search">${icon({ d: 'M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13zM15.5 15.5 21 21' }, 20)}<input id="pq" type="search" enterkeyhint="search" placeholder="Buscar actor, actriz o director…" value="${esc(pp.q)}" aria-label="Buscar personas"></div></form>
  ${fol.length && !pp.q ? `<h3 class="row-t">Siguiendo (${fol.length})</h3><div class="people">${fol.map(f => personCard({ id: f.id, name: f.name, photo: f.photo })).join('')}</div>` : ''}
  <h3 class="row-t" id="ptitle">${pp.q ? `Resultados para “${esc(pp.q)}”` : 'Populares ahora'}</h3><div id="pres">${spinner()}</div>`;
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

/* ===================== Para vos ===================== */
let recsCache = null;
async function renderRecs() {
  const W = Object.values(D.watched), F = Object.values(D.follows), G = (D.profile && D.profile.fav_genres) || [];
  app.innerHTML = `<h2 class="sec">Para vos</h2><p class="muted">Según lo que viste, los actores que seguís y tus géneros favoritos.</p><div id="recbody">${spinner()}</div>`;
  if (needsAccount() || (!W.length && !F.length && !G.length)) {
    $('#recbody').innerHTML = emptyBox('Marcá lo que ya viste, seguí a algún actor o elegí tus géneros favoritos y acá te armo recomendaciones a tu medida.',
      `<p><a class="btn" href="#explorar">Explorar</a> <a class="btn ghost" href="#actores">Buscar actores</a></p>`);
    return;
  }
  if (!recsCache) {
    const score = {};
    const base = W.slice().sort((a, b) => b.at - a.at).slice(0, 12);
    await Promise.all(base.map(async (b, bi) => {
      try {
        const d = await api(`${b.type}/${b.id}/recommendations`);
        d.results.forEach((r, ri) => { const n = norm(r, b.type), k = kOf(n); if (D.watched[k]) return; const sc = score[k] || (score[k] = { n, s: 0, from: [] }); sc.s += (20 - ri) / 20 + (12 - bi) / 24 + (n.vote || 0) / 20; if (sc.from.length < 2) sc.from.push(b.title); });
      } catch (e) {}
    }));
    const recs = Object.values(score).sort((a, b) => b.s - a.s).slice(0, 36);
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
    (recs.length ? `<h3 class="row-t">Te van a gustar</h3><div class="grid">${recs.map(r => card(r.n, `<small class="why">Porque viste ${esc(r.from[0])}</small>`)).join('')}</div>` : '') +
    `<button class="btn ghost more" id="rerec">Actualizar recomendaciones</button>`;
  $('#rerec').onclick = () => { recsCache = null; renderRecs(); };
}

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
    l.sort(mine.sort === 'titulo' ? (a, b) => a.title.localeCompare(b.title) : mine.sort === 'anio' ? (a, b) => (b.year || '').localeCompare(a.year || '') : (a, b) => b.at - a.at);
    body = `<div class="tools"><div class="seg" id="mtype"><button data-v="all" aria-pressed="${mine.type === 'all'}">Todo</button><button data-v="movie" aria-pressed="${mine.type === 'movie'}">Pelis</button><button data-v="tv" aria-pressed="${mine.type === 'tv'}">Series</button></div>
    <label class="sr" for="msort">Ordenar</label><select id="msort" class="btn ghost small"><option value="reciente">Agregadas recién</option><option value="titulo">Por título</option><option value="anio">Por año</option></select></div>` +
      (l.length ? `<div class="grid">${l.map(n => card(n)).join('')}</div>` : emptyBox(mine.tab === 'vistas' ? 'Todavía no marcaste nada como visto. Tocá el ícono de cualquier portada.' : 'Tu lista “quiero ver” está vacía. Abrí una peli y tocá “Quiero verla”.'));
  }
  const localCount = Object.keys(L.watched).length + Object.keys(L.want).length;
  app.innerHTML = `${CLOUD && D.cloudEmpty && localCount ? `<div class="banner"><span>Encontré <b>${localCount}</b> títulos guardados en este navegador. ¿Los paso a tu cuenta?</span><button class="btn small" id="imp">Importar</button></div>` : ''}
  <section class="profile">${myAvatar(140)}<div>
   <h2>${esc(p.display_name || p.username)}</h2>${p.username ? `<div class="handle">@${esc(p.username)}</div>` : ''}
   ${p.bio ? `<p style="margin:8px 0 0">${esc(p.bio)}</p>` : ''}
   <div class="stats"><div class="stat"><b>${nm}</b><span>películas</span></div><div class="stat"><b>${W.length - nm}</b><span>series</span></div><div class="stat"><b>${A.length}</b><span>quiero ver</span></div><div class="stat"><b>${F.length}</b><span>actores</span></div></div>
   <div class="acts"><a class="btn small" href="#editar">Editar personaje y estilo</a>${CLOUD ? '<button class="btn ghost small" id="logout">Cerrar sesión</button>' : ''}</div></div></section>
  <div class="tools" style="margin-top:22px"><div class="seg" id="mtab"><button data-v="vistas" aria-pressed="${mine.tab === 'vistas'}">Vistas (${W.length})</button><button data-v="quiero" aria-pressed="${mine.tab === 'quiero'}">Quiero ver (${A.length})</button><button data-v="actores" aria-pressed="${mine.tab === 'actores'}">Actores (${F.length})</button></div></div>
  ${body}
  <details class="box" style="margin-top:40px"><summary><b>Ajustes y copia de seguridad</b></summary>
   <form id="setf"><label class="field"><span>País</span><small>Para “dónde verla” y los estrenos en cines</small><select id="sr">${[['AR', 'Argentina'], ['UY', 'Uruguay'], ['CL', 'Chile'], ['MX', 'México'], ['ES', 'España'], ['CO', 'Colombia'], ['PE', 'Perú'], ['US', 'Estados Unidos']].map(r => `<option value="${r[0]}" ${L.region === r[0] ? 'selected' : ''}>${r[1]}</option>`).join('')}</select></label>
   <label class="field"><span>Idioma de títulos y sinopsis</span><select id="sl"><option value="es-MX">Español latino</option><option value="es-ES">Español de España</option><option value="en-US">Inglés</option></select></label>
   ${CLOUD ? '' : `<label class="field"><span>Clave de TMDB</span><input id="sk" value="${esc(L.key)}" autocomplete="off"></label>`}
   <div class="acts"><button class="btn">Guardar ajustes</button><button type="button" class="btn ghost" id="exp">Descargar copia</button>${CLOUD ? '' : '<label class="btn ghost">Cargar copia<input type="file" id="impf" accept=".json" hidden></label>'}</div><p class="err" id="serr"></p></form></details>`;
  $('#sl').value = L.lang;
  if ($('#msort')) { $('#msort').value = mine.sort; $('#msort').onchange = e => { mine.sort = e.target.value; renderMe(); }; }
  $('#mtab').onclick = e => { if (e.target.dataset.v) { mine.tab = e.target.dataset.v; renderMe(); } };
  if ($('#mtype')) $('#mtype').onclick = e => { if (e.target.dataset.v) { mine.type = e.target.dataset.v; renderMe(); } };
  if ($('#imp')) $('#imp').onclick = async () => { $('#imp').disabled = true; try { await importLocal(); renderMe(); } catch (e) { toast('No se pudo importar: ' + e.message); $('#imp').disabled = false; } };
  if ($('#logout')) $('#logout').onclick = async () => { await sb.auth.signOut(); toast('Sesión cerrada'); };
  $('#setf').onsubmit = async e => {
    e.preventDefault();
    try {
      if (!CLOUD) { const k = $('#sk').value.trim(); if (k !== L.key) { await api('configuration', {}, k); L.key = k; } }
      if (L.lang !== $('#sl').value) { L.cache = {}; ex.items = []; genreCache = {}; pp.items = []; }
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
  const p = { username: '', display_name: '', avatar: 'cinefilo', color: COLORS[0], theme: curTheme(), bio: '', fav_genres: [], prefs: { skin: SKINS[0] }, ...(D.profile || {}) };
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
     <label class="field"><span>Nombre de usuario</span><input id="fu" maxlength="20" value="${esc(p.username)}" placeholder="ej: juampi_cine" autocapitalize="none" autocomplete="username" ${CLOUD ? 'required' : ''}><small>Minúsculas, números y guion bajo (3 a 20).</small></label>
     <label class="field"><span>Bio</span><textarea id="fb" maxlength="200" placeholder="Fan de las sagas largas y los finales que no se ven venir.">${esc(p.bio)}</textarea></label>
     <h3 style="margin-top:8px">Géneros favoritos</h3><div class="chips" id="gp" style="flex-wrap:wrap">${gl.map(g => `<button type="button" data-g="${g.id}" aria-pressed="${p.fav_genres.includes(g.id)}">${esc(g.name)}</button>`).join('')}</div></section>
    <section class="box"><h3>Estilo de la app</h3><p class="muted" style="margin-top:-4px">Cambia colores, tipografía, íconos y fondo. Tocá uno para probarlo.</p>
     <div class="themes" id="thp">${Object.entries(THEMES).map(([id, th]) => `<button type="button" class="themecard" data-th="${id}" aria-pressed="${p.theme === id}" style="background:${th.c.bg} ${th.pattern};background-size:${th.patternSize || 'auto'};color:${th.c.ink}"><div class="tp"><span style="color:${th.c.acc}">${icon(th.mark, 30)}</span><b style="font-family:${esc(th.font)}">${esc(th.name)}</b></div><div class="dots"><i style="background:${th.c.acc}"></i><i style="background:${th.c.acc2}"></i><i style="background:${th.c.panel}"></i></div></button>`).join('')}</div>
     <p class="muted" style="margin-bottom:0">Estilo elegido: <b>${esc(t.name)}</b> · “${esc(t.loading)}”</p></section>
    <div class="stickybar"><span class="err" id="perr" style="margin-right:auto;align-self:center"></span>${first ? '' : '<a class="btn ghost" href="#yo" id="pcancel">Cancelar</a>'}<button class="btn" id="psave">${first ? 'Crear mi personaje' : 'Guardar cambios'}</button></div></div>`;
    const keep = () => { p.display_name = $('#fn').value; p.username = $('#fu').value.toLowerCase().replace(/[^a-z0-9_]/g, ''); p.bio = $('#fb').value; };
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
        await saveProfile({ username: p.username || 'yo', display_name: p.display_name.trim() || p.username || 'Cinéfilo', avatar: p.avatar, color: p.color, theme: p.theme, bio: p.bio.trim(), fav_genres: p.fav_genres, prefs: p.prefs });
        recsCache = null; renderShell(); toast(first ? '¡Bienvenido a MiCine!' : 'Perfil guardado'); go(first ? 'explorar' : 'yo');
      } catch (er) { $('#perr').textContent = er.message; $('#psave').disabled = false; }
    };
  };
  draw();
}

/* ===================== Ficha (modal) ===================== */
let openKey = null;
async function openDetail(k, silent) {
  const n = REG[k]; if (!n) return; openKey = k;
  const m = $('#modal'), sh = $('#sheet');
  if (!silent) { m.classList.add('open'); document.body.style.overflow = 'hidden'; sh.innerHTML = `<button class="close" data-close aria-label="Cerrar">✕</button><div class="hero"></div>${spinner()}`; if (!history.state || !history.state.modal) history.pushState({ modal: 1 }, ''); }
  let d = n._d;
  if (!d) { try { d = await api(`${n.type}/${n.id}`, { append_to_response: 'credits,recommendations,watch/providers' }); n._d = d; } catch (e) { sh.innerHTML = `<button class="close" data-close aria-label="Cerrar">✕</button><p class="err" style="padding:30px">${esc(e.message)}</p>`; return; } }
  if (openKey !== k) return;
  const t = T(), w = D.watched[k], wa = D.want[k];
  const dur = n.type === 'movie' ? (d.runtime ? `${Math.floor(d.runtime / 60)} h ${d.runtime % 60} min` : '') : `${d.number_of_seasons || '?'} temporada${d.number_of_seasons === 1 ? '' : 's'}`;
  const pv = (d['watch/providers']?.results || {})[L.region] || {};
  const provs = [...(pv.flatrate || []), ...(pv.free || []), ...(pv.ads || [])];
  const rent = [...(pv.rent || []), ...(pv.buy || [])].filter((p, i, a) => a.findIndex(q => q.provider_id === p.provider_id) === i);
  const recs = (d.recommendations?.results || []).slice(0, 14).map(r => norm(r, n.type));
  const cast = (d.credits?.cast || []).slice(0, 14);
  const dir = (d.credits?.crew || []).filter(c => c.job === 'Director').slice(0, 2);
  const creators = d.created_by || [];
  sh.innerHTML = `<button class="close" data-close aria-label="Cerrar">✕</button>
  <div class="hero" style="background-image:url('${img(d.backdrop_path, 'w1280')}')"></div>
  <div class="dbody"><div><div class="poster" style="cursor:default">${n.poster ? `<img src="${img(n.poster, 'w500')}" alt="">` : `<span>${esc(n.title)}</span>`}</div></div>
  <div><h2>${esc(d.title || d.name)}</h2>
   ${(d.original_title || d.original_name) !== (d.title || d.name) ? `<div class="muted">${esc(d.original_title || d.original_name)}</div>` : ''}
   <div class="facts">${[n.year, n.type === 'tv' ? 'Serie' : 'Película', dur, (d.genres || []).map(g => g.name).join(', '), d.vote_average ? `★ ${d.vote_average.toFixed(1)}` : ''].filter(Boolean).map(esc).join(' · ')}</div>
   <div class="acts"><button class="btn${w ? ' on' : ''}" data-tick="${k}">${icon(t.mark, 20)}${w ? 'Ya la vi' : 'Marcar como vista'}</button>
   ${w ? '' : `<button class="btn ghost" data-want="${k}">${icon(t.want, 20)}${wa ? 'En “quiero ver”' : 'Quiero verla'}</button>`}
   ${d.belongs_to_collection ? `<a class="btn ghost" href="#saga-col${d.belongs_to_collection.id}" data-close>Ver saga: ${esc(d.belongs_to_collection.name)}</a>` : ''}</div>
   <p>${esc(d.overview || 'Sin sinopsis en español todavía.')}</p>
   ${dir.length ? `<p><b>Dirección:</b> ${dir.map(c => `<a href="#actor-${c.id}" data-close>${esc(c.name)}</a>`).join(', ')}</p>` : ''}
   ${creators.length ? `<p><b>Creada por:</b> ${creators.map(c => `<a href="#actor-${c.id}" data-close>${esc(c.name)}</a>`).join(', ')}</p>` : ''}
   ${d.tagline ? `<p class="muted"><i>${esc(d.tagline)}</i></p>` : ''}
  </div>
  <div class="full"><h3>Dónde verla</h3>
   ${provs.length ? `<div class="provs">${provs.map(p => `<img src="${img(p.logo_path, 'w92')}" alt="${esc(p.provider_name)}" title="${esc(p.provider_name)}">`).join('')}</div>` : '<p class="muted">No figura en plataformas de suscripción en tu país.</p>'}
   ${rent.length ? `<p class="muted" style="margin-top:8px">Alquiler o compra: ${esc(rent.map(p => p.provider_name).join(', '))}</p>` : ''}
   ${pv.link ? `<p><a href="${esc(pv.link)}" target="_blank" rel="noopener">Ver todas las opciones</a></p>` : ''}</div>
  ${cast.length ? `<div class="full"><h3>Reparto</h3><div class="castrow">${cast.map(c => `<button data-person="${c.id}" data-close><div class="face">${c.profile_path ? `<img loading="lazy" src="${img(c.profile_path, 'w185')}" alt="">` : esc(c.name.slice(0, 1))}</div><b>${esc(c.name)}</b>${c.character ? `<small>${esc(c.character)}</small>` : ''}${D.follows[c.id] ? '<small class="why" style="color:var(--acc2)">Lo seguís</small>' : ''}</button>`).join('')}</div></div>` : ''}
  ${recs.length ? `<div class="full"><h3>Si te gustó, mirá</h3><div class="hrow">${recs.map(r => card(r)).join('')}</div></div>` : ''}
  </div>`;
}
function closeDetail(fromPop) {
  if (!openKey && !$('#modal').classList.contains('open')) return;
  openKey = null; $('#modal').classList.remove('open'); document.body.style.overflow = '';
  if (!fromPop && history.state && history.state.modal) history.back();
}

/* ===================== Eventos ===================== */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-tick],[data-open],[data-want],[data-follow],[data-person],[data-close]');
  if (!t) { if (e.target.id === 'modal') closeDetail(); return; }
  if (t.dataset.tick) { e.preventDefault(); toggleWatched(t.dataset.tick); }
  else if (t.dataset.want) toggleWant(t.dataset.want);
  else if (t.dataset.open) openDetail(t.dataset.open);
  else if (t.dataset.follow) toggleFollow({ id: t.dataset.follow, name: t.dataset.name, photo: t.dataset.photo });
  else if (t.dataset.person) { closeDetail(true); go('actor-' + t.dataset.person); }
  else if (t.dataset.close !== undefined) { const href = t.getAttribute('href'); if (href) { e.preventDefault(); closeDetail(true); go(href.slice(1)); } else closeDetail(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modal').classList.contains('open')) closeDetail(); });
addEventListener('popstate', () => { if ($('#modal').classList.contains('open')) closeDetail(true); });
addEventListener('hashchange', () => { if ($('#modal').classList.contains('open')) closeDetail(true); route(); scrollTo(0, 0); });

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
        else { D.watched = {}; D.want = {}; D.follows = {}; D.profile = null; }
        recsCache = null; applyTheme(curTheme()); renderShell();
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
