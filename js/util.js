// Small shared helpers. No dependencies.

/* ------------------------------------------------------------------- DOM */
export function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'text') n.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (k === 'data' && typeof v === 'object') {
      for (const [dk, dv] of Object.entries(v)) n.dataset[dk] = dv;
    } else n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(9)) {
    if (kid === null || kid === undefined || kid === false) continue;
    n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return n;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/* ----------------------------------------------------------------- money */
export const toman = (n) => Math.round(n).toLocaleString('en-US');

export const money = (n) => `${toman(n)} Toman`;

/* ------------------------------------------------------------------ time */
const D_LONG = new Intl.DateTimeFormat('en-US', {
  day: 'numeric', month: 'long', year: 'numeric',
});
const D_SHORT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const D_WEEK = new Intl.DateTimeFormat('en-US', { weekday: 'long' });

export const dateLong = (d) => D_LONG.format(d instanceof Date ? d : new Date(d));
export const dateShort = (d) => D_SHORT.format(d instanceof Date ? d : new Date(d));
export const weekday = (d) => D_WEEK.format(d instanceof Date ? d : new Date(d));

export function dateTime(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const t = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(dt);
  return `${dateShort(dt)} · ${t}`;
}

export function relative(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const mins = Math.round((Date.now() - dt.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} d ago`;
  return dateShort(dt);
}

/* --------------------------------------------------------------- strings */
export const id = (p = '') =>
  p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

// Order numbers the shop can read down a phone line.
export function orderNo(seed = Date.now()) {
  return 'K' + String(seed % 100000).padStart(5, '0');
}

// Iranian mobile numbers: 09xxxxxxxxx, or +989xxxxxxxxx.
export function validPhone(v) {
  const s = String(v || '').replace(/[\s-]/g, '').replace(/^\+98/, '0').replace(/^98/, '0');
  return /^09\d{9}$/.test(s) ? s : null;
}

export const telHref = (p) => 'tel:' + String(p).replace(/[^\d+]/g, '');

// Phone display: 0930 880 5590
export function prettyPhone(p) {
  const s = String(p).replace(/\D/g, '');
  return s.length === 11 ? `${s.slice(0, 4)} ${s.slice(4, 7)} ${s.slice(7)}` : s;
}

/* ------------------------------------------------------------------ misc */
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;

// Progress of v through [a,b], clamped to 0..1.
export const range = (v, a, b) => clamp((v - a) / (b - a || 1), 0, 1);

export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const reduceMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function debounce(fn, ms = 150) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// A soft tap, where the platform has one. Silent everywhere else.
export function haptic(ms = 8) {
  if (navigator.vibrate) { try { navigator.vibrate(ms); } catch { /* ignore */ } }
}

export function scrollTop(smooth = false) {
  window.scrollTo({ top: 0, behavior: smooth && !reduceMotion() ? 'smooth' : 'auto' });
}
