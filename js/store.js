// State, persisted to localStorage.
//
// This is a preview: there is no server, so the bag, the profile, the orders
// and the shop's own CRM board all live in the browser. Every write goes
// through save() and every read through the same object, so swapping in a real
// backend later is one file's worth of work rather than a rewrite.

import { id, orderNo } from './util.js';
import { PRODUCTS } from './data.js';

const KEY = 'kaya.v1';

const blank = () => ({
  bag: [],
  favs: [],
  profile: { name: '', phone: '', addresses: [], recipients: [] },
  orders: [],
  seenIntro: false,
  crm: { unlocked: false },
  // Stock is the shop's, not the customer's — the CRM toggles it.
  stock: Object.fromEntries(PRODUCTS.map((p) => [p.slug, true])),
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    // Merge over a blank so a shape added after the client's first visit
    // does not read as undefined on their second.
    return { ...blank(), ...v, profile: { ...blank().profile, ...(v.profile || {}) },
             stock: { ...blank().stock, ...(v.stock || {}) } };
  } catch { return null; }
}

export const state = load() || seed(blank());

let writing = 0;
export function save() {
  clearTimeout(writing);
  writing = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
  }, 60);
  emit();
}

/* ----------------------------------------------------------- subscribers */
const subs = new Set();
export function onChange(fn) { subs.add(fn); return () => subs.delete(fn); }
function emit() { subs.forEach((f) => f(state)); }

/* ------------------------------------------------------------------- bag */
export const bagCount = () => state.bag.reduce((n, l) => n + l.qty, 0);
export const bagTotal = () => state.bag.reduce((n, l) => n + l.price * l.qty, 0);

export function addToBag(line) {
  // Same product, same size, same add-ons, same message => one line.
  const key = JSON.stringify([line.slug, line.size, [...(line.addons || [])].sort(), line.note || '']);
  const hit = state.bag.find((l) => l.key === key);
  if (hit) hit.qty += line.qty || 1;
  else state.bag.push({ ...line, key, qty: line.qty || 1, id: id('l') });
  save();
}

export function setQty(lineId, qty) {
  const l = state.bag.find((x) => x.id === lineId);
  if (!l) return;
  if (qty <= 0) state.bag = state.bag.filter((x) => x.id !== lineId);
  else l.qty = qty;
  save();
}

export function clearBag() { state.bag = []; save(); }

/* --------------------------------------------------------------- favours */
export const isFav = (slug) => state.favs.includes(slug);
export function toggleFav(slug) {
  state.favs = isFav(slug) ? state.favs.filter((s) => s !== slug) : [slug, ...state.favs];
  save();
  return isFav(slug);
}

/* ---------------------------------------------------------------- orders */
export function placeOrder(order) {
  const o = {
    id: id('o'),
    no: orderNo(Date.now() + state.orders.length),
    at: Date.now(),
    status: 'new',
    ...order,
  };
  state.orders.unshift(o);
  save();
  return o;
}

export function setStatus(orderId, status) {
  const o = state.orders.find((x) => x.id === orderId);
  if (!o) return;
  o.status = status;
  o.log = [...(o.log || []), { s: status, at: Date.now() }];
  save();
}

export const STATUS = {
  new: { name: 'ثبت شد', s: 'new' },
  prep: { name: 'در حال آماده‌سازی', s: 'prep' },
  out: { name: 'در مسیر', s: 'out' },
  done: { name: 'تحویل شد', s: 'done' },
  cancel: { name: 'لغو شد', s: 'cancel' },
};

/* -------------------------------------------------------------- profile */
export function saveProfile(patch) {
  Object.assign(state.profile, patch);
  save();
}

export function addAddress(a) {
  const rec = { id: id('a'), ...a };
  state.profile.addresses.unshift(rec);
  save();
  return rec;
}

export function removeAddress(aid) {
  state.profile.addresses = state.profile.addresses.filter((a) => a.id !== aid);
  save();
}

/* ------------------------------------------------------------------ crm */
export function toggleStock(slug) {
  state.stock[slug] = !state.stock[slug];
  save();
  return state.stock[slug];
}

// Customers are derived from orders, not stored twice.
export function customers() {
  const map = new Map();
  for (const o of state.orders) {
    const phone = o.buyer?.phone || '—';
    const c = map.get(phone) || { phone, name: o.buyer?.name || '—', n: 0, spend: 0, last: 0 };
    c.n += 1;
    if (o.status !== 'cancel') c.spend += o.total || 0;
    c.last = Math.max(c.last, o.at);
    if (o.buyer?.name) c.name = o.buyer.name;
    map.set(phone, c);
  }
  return [...map.values()].sort((a, b) => b.spend - a.spend);
}

export function resetAll() {
  const fresh = seed(blank());
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, fresh);
  save();
}

/* ----------------------------------------------------------------- seed */
// A brand-new browser opening the CRM to an empty board tells the client
// nothing about what the CRM is. Three orders, backdated, give it a pulse —
// and they are only written on the very first visit, so anything the client
// does afterwards is his own.
function seed(s) {
  const H = 3600000;
  const mk = (over) => ({
    id: id('o'), at: Date.now() - over.ago, status: over.status,
    no: orderNo(Date.now() - over.ago),
    buyer: over.buyer, recipient: over.recipient,
    items: over.items, total: over.total,
    delivery: over.delivery, demo: true,
  });
  s.orders = [
    mk({
      ago: 0.6 * H, status: 'new',
      buyer: { name: 'سارا مهدوی', phone: '09145550132' },
      recipient: { name: 'الهام رستمی', phone: '09355550187', address: 'تبریز، ولیعصر، برج بلور، طبقه ۷' },
      items: [{ slug: 'arghavan', name: 'ارغوان', size: 'm', qty: 1, price: 6960000 }],
      total: 7050000,
      delivery: { zone: 'central', date: Date.now() + 4 * H, slot: '۱۵ تا ۱۸', fee: 90000 },
    }),
    mk({
      ago: 5 * H, status: 'out',
      buyer: { name: 'بهنام آذری', phone: '09141110098' },
      recipient: { name: 'دفتر مرکزی آرتان', phone: '04133445566', address: 'تبریز، آبرسان، ساختمان نگین، واحد ۲' },
      items: [{ slug: 'banafsheh', name: 'بنفشه', size: 'l', qty: 1, price: 13440000 }],
      total: 13590000,
      delivery: { zone: 'wide', date: Date.now() + 1 * H, slot: '۱۲ تا ۱۵', fee: 150000 },
    }),
    mk({
      ago: 30 * H, status: 'done',
      buyer: { name: 'سارا مهدوی', phone: '09145550132' },
      recipient: { name: 'خودم', phone: '09145550132', address: 'تبریز، ائل‌گلی، کوی فردوس' },
      items: [{ slug: 'shahd', name: 'شهد', size: 's', qty: 2, price: 1980000 }],
      total: 4050000,
      delivery: { zone: 'central', date: Date.now() - 26 * H, slot: '۹ تا ۱۲', fee: 90000 },
    }),
  ];
  return s;
}
