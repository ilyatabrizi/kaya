// Boot: brand assets, routes, the chrome around the views, and the service
// worker. Views are loaded on demand so the first paint only pays for home.

import { el, scrollTop, haptic } from './util.js';
import { icon } from './icons.js';
import { route, startRouter, onRoute, currentRoute, go } from './router.js';
import { loadBrand, brandEl, wordmark, closeSheet } from './ui.js';
import { state, onChange, bagCount } from './store.js';
import { registerSW, isStandalone } from './install.js';

const main = document.getElementById('main');
const boot = document.getElementById('boot');
const tabbar = document.getElementById('tabbar');
const topbar = document.getElementById('topbar');

/* ----------------------------------------------------------------- routes */
route('/', () => import('./views/home.js').then((m) => m.default));
route('/shop', () => import('./views/shop.js').then((m) => m.default));
route('/p/:slug', () => import('./views/item.js').then((m) => m.default));
route('/custom', () => import('./views/custom.js').then((m) => m.default));
route('/bag', () => import('./views/bag.js').then((m) => m.default));
route('/checkout', () => import('./views/checkout.js').then((m) => m.default));
route('/orders', () => import('./views/orders.js').then((m) => m.ordersList));
route('/order/:oid', () => import('./views/orders.js').then((m) => m.orderDetail));
route('/account', () => import('./views/account.js').then((m) => m.default));
route('/about', () => import('./views/about.js').then((m) => m.default));
route('/crm', () => import('./views/crm.js').then((m) => m.default));

/* ---------------------------------------------------------------- the tabs */
const TABS = [
  { to: '/', ic: 'home', name: 'Home' },
  { to: '/shop', ic: 'flower', name: 'Shop' },
  { to: '/custom', ic: 'spark', name: 'Bespoke' },
  { to: '/bag', ic: 'bag', name: 'Bag', badge: true },
  { to: '/account', ic: 'user', name: 'Profile' },
];

const pill = el('span', { class: 'tabbar__pill' });
const tabEls = [];

function buildTabs() {
  tabbar.append(pill);
  TABS.forEach((t) => {
    const a = el('a', {
      class: 'tab', href: '#' + t.to, 'aria-label': t.name,
      onclick: () => haptic(6),
    },
      el('span', { html: icon(t.ic), style: { display: 'contents' } }),
      el('span', { text: t.name }),
    );
    if (t.badge) a.append(el('span', { class: 'tab__dot', hidden: true }));
    tabEls.push(a);
    tabbar.append(a);
  });
  tabbar.hidden = false;
}

function movePill(i) {
  const a = tabEls[i];
  if (!a) { pill.style.opacity = '0'; return; }
  pill.style.opacity = '1';
  const box = tabbar.getBoundingClientRect();
  const cell = a.getBoundingClientRect();
  pill.style.width = `${cell.width}px`;
  pill.style.transform = `translateX(${cell.left - box.left}px)`;
}

function paintBadges() {
  const n = bagCount();
  tabEls.forEach((a, i) => {
    if (!TABS[i].badge) return;
    const dot = a.querySelector('.tab__dot');
    dot.hidden = n === 0;
    dot.textContent = String(n);
  });
  const tb = topbar.querySelector('.iconbtn__dot');
  if (tb) { tb.hidden = n === 0; tb.textContent = String(n); }
}

/* -------------------------------------------------------------- the topbar */
const TOPLINKS = [
  { to: '/shop', name: 'Shop' },
  { to: '/custom', name: 'Bespoke' },
  { to: '/about', name: 'About & contact' },
];

function buildTopbar() {
  topbar.querySelector('.topbar__brand').append(brandEl('word', ''));
  const links = topbar.querySelector('.topbar__links');
  TOPLINKS.forEach((l) => links.append(el('a', { href: '#' + l.to, text: l.name })));
  const acts = topbar.querySelector('.topbar__acts');
  acts.append(el('a', {
    class: 'iconbtn', href: '#/bag', 'aria-label': 'Bag',
  }, el('span', { html: icon('bag'), style: { display: 'contents' } }),
     el('span', { class: 'iconbtn__dot', hidden: true })));
  acts.append(el('a', {
    class: 'iconbtn', href: '#/account', 'aria-label': 'Profile',
    html: icon('user'),
  }));
  topbar.hidden = false;
}

// On home the top bar waits for the hero to hand over — the hero is three
// viewports of sticky scrub, and a bar floating over it for two of them is
// just clutter over the one thing meant to be looked at. Everywhere else the
// bar is there from the first pixel, because those pages open with a title.
let topbarAlways = false;
function syncTopbar() {
  let on = topbarAlways;
  if (!on) {
    const hero = document.querySelector('.hero');
    const after = hero
      ? hero.offsetTop + hero.offsetHeight - window.innerHeight * 1.05
      : window.innerHeight * 0.72;
    on = window.scrollY > after;
  }
  topbar.classList.toggle('is-on', on);
}

/* --------------------------------------------------------- hide on scroll */
// The tab bar gets out of the way when reading down a long page and comes
// straight back on the first upward flick.
let lastY = 0;
function scrollChrome() {
  const y = window.scrollY;
  const down = y > lastY && y > 220;
  // Never hide it while a dock is showing an action, or the page ends.
  const atEnd = y + window.innerHeight > document.body.scrollHeight - 90;
  tabbar.classList.toggle('is-down', down && !atEnd);
  lastY = y;
  syncTopbar();
}

/* -------------------------------------------------------------- rendering */
let currentView = null;

onRoute((r, view) => {
  closeSheet();
  const isHome = r.pattern === '/';
  topbarAlways = !isHome;
  document.documentElement.classList.toggle('is-home', isHome);

  // Item and checkout pages own the bottom of the screen.
  const hideTabs = ['/p/:slug', '/checkout', '/crm'].includes(r.pattern);
  tabbar.style.display = hideTabs ? 'none' : '';

  main.replaceChildren();
  const node = view();
  main.append(node);
  currentView = node;

  const i = TABS.findIndex((t) => t.to === r.path
    || (t.to !== '/' && r.path.startsWith(t.to)));
  tabEls.forEach((a, n) => a.classList.toggle('is-on', n === i));
  requestAnimationFrame(() => movePill(i));

  paintBadges();
  lastY = 0;
  tabbar.classList.remove('is-down');
  scrollTop();
  syncTopbar();

  // Move focus for keyboard and screen readers without stealing it on a tap.
  if (!isHome) main.focus({ preventScroll: true });

  document.title = titleFor(r);
});

function titleFor(r) {
  const map = {
    '/': 'KAYA — Flower Atelier, Tabriz',
    '/shop': 'The pieces — KAYA',
    '/custom': 'Bespoke — KAYA',
    '/bag': 'Bag — KAYA',
    '/checkout': 'Delivery — KAYA',
    '/orders': 'My orders — KAYA',
    '/account': 'Profile — KAYA',
    '/about': 'About — KAYA',
    '/crm': 'Studio — KAYA',
  };
  return map[r.pattern] || 'KAYA';
}

/* ------------------------------------------------------------------- boot */
async function start() {
  await loadBrand();
  // The boot screen is the wordmark, painted the moment the SVG lands.
  boot.querySelector('.boot__mark').innerHTML = wordmark();

  buildTabs();
  buildTopbar();
  startRouter();

  addEventListener('scroll', scrollChrome, { passive: true });
  addEventListener('resize', () => movePill(
    TABS.findIndex((t) => t.to === currentRoute()?.path)), { passive: true });
  onChange(paintBadges);

  // Hold the boot screen just long enough for the mark to be read, then let
  // the page through. Any longer is theatre at the client's expense.
  const seen = sessionStorage.getItem('kaya.booted');
  setTimeout(() => {
    boot.classList.add('is-gone');
    setTimeout(() => boot.remove(), 520);
    sessionStorage.setItem('kaya.booted', '1');
  }, seen ? 120 : 900);

  registerSW();
  if (isStandalone()) document.documentElement.classList.add('is-app');
}

start();
