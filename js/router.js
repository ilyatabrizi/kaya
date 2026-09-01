// Hash routing. GitHub Pages serves this from a project subpath and has no
// rewrite rules, so hashes are the only form of deep link that survives a
// refresh — #/p/aftab works from a cold load, /p/aftab would 404.

const routes = [];
let current = null;
const listeners = new Set();

export function route(pattern, load) {
  // '/p/:slug' -> /^\/p\/([^/]+)$/
  const keys = [];
  const rx = new RegExp('^' + pattern.replace(/:([a-zA-Z]+)/g, (_, k) => {
    keys.push(k);
    return '([^/]+)';
  }).replace(/\//g, '\\/') + '$');
  routes.push({ rx, keys, load, pattern });
}

export function onRoute(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export const path = () => {
  const h = location.hash.replace(/^#/, '') || '/';
  return h.startsWith('/') ? h : '/' + h;
};

export function go(to, { replace = false } = {}) {
  const next = '#' + (to.startsWith('/') ? to : '/' + to);
  if (location.hash === next) { resolve(); return; }
  if (replace) history.replaceState(null, '', next);
  else location.hash = next;
}

export function back(fallback = '/') {
  // history.length is 1 on a cold deep link — there is nothing to go back to.
  if (history.length > 1 && document.referrer !== '') history.back();
  else go(fallback, { replace: true });
}

let token = 0;
async function resolve() {
  const p = path();
  const [, query] = p.split('?');
  const clean = p.split('?')[0];
  const mine = ++token;

  for (const r of routes) {
    const m = clean.match(r.rx);
    if (!m) continue;
    const params = {};
    r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
    const q = Object.fromEntries(new URLSearchParams(query || ''));
    const view = await r.load();
    if (mine !== token) return;              // a faster navigation won
    current = { pattern: r.pattern, params, q, path: clean };
    listeners.forEach((f) => f(current, view));
    return;
  }
  // Unknown hash: home, without leaving a dead entry in history.
  go('/', { replace: true });
}

export const currentRoute = () => current;

export function startRouter() {
  addEventListener('hashchange', resolve);
  resolve();
}
