// The shop's side of the app.
//
// Behind a passcode, on the same device, reading the same store. In a real
// deployment this is a separate login against a server; for a preview the
// point is to show the client the board he would work from every morning —
// what came in, what has to leave when, who is buying, and what he has run
// out of.

import {
  el, money, relative, faDateTime, faShort, prettyPhone, haptic, telHref,
} from '../util.js';
import { icon } from '../icons.js';
import { BRAND, DELIVERY, SIZES, ADDONS } from '../config.js';
import { PRODUCTS } from '../data.js';
import { pageHead, toast, sheet, note, photo, brandEl, empty } from '../ui.js';
import { go } from '../router.js';
import {
  state, save, setStatus, STATUS, toggleStock, customers,
} from '../store.js';
import { briefBlock } from './orders.js';

const BOARD = [
  { id: 'today', name: 'امروز' },
  { id: 'new', name: 'جدید' },
  { id: 'prep', name: 'آماده‌سازی' },
  { id: 'out', name: 'در مسیر' },
  { id: 'done', name: 'تحویل شده' },
  { id: 'people', name: 'مشتری‌ها' },
  { id: 'stock', name: 'موجودی' },
];

export default function crm() {
  if (!state.crm.unlocked) return lockScreen();

  const v = el('div', { class: 'view page crm' });
  const wrap = el('div', { class: 'wrap' });

  /* ------------------------------------------------------------- header */
  wrap.append(el('div', {
    style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' },
  },
    brandEl('word', ''),
    el('div', { style: { marginInlineStart: 'auto', display: 'flex', gap: '6px' } },
      el('button', {
        class: 'iconbtn', type: 'button', 'aria-label': 'خروج', html: icon('lock'),
        onclick: () => { state.crm.unlocked = false; save(); toast('خارج شدید'); go('/'); },
      }),
    ),
  ));
  wrap.firstChild.firstChild.style.width = '78px';
  wrap.append(el('div', { class: 'eyebrow eyebrow--ink', style: { marginBottom: '18px' },
    text: 'Studio · Orders' }));

  /* -------------------------------------------------------------- stats */
  const stats = el('div', { class: 'stats' });
  wrap.append(stats);

  const tabs = el('div', { class: 'tabs' });
  let tab = 'today';
  BOARD.forEach((b) => {
    tabs.append(el('button', {
      class: 'tabs-b' + (b.id === tab ? ' is-on' : ''), type: 'button', text: b.name,
      onclick: (e) => {
        tab = b.id;
        [...tabs.children].forEach((c) => c.classList.remove('is-on'));
        e.currentTarget.classList.add('is-on');
        paint();
      },
    }));
  });
  wrap.append(tabs);

  const body = el('div', {});
  wrap.append(body);
  v.append(wrap);

  /* -------------------------------------------------------------- paint */
  function paintStats() {
    const today = startOfDay();
    const open = state.orders.filter((o) => ['new', 'prep', 'out'].includes(o.status));
    const dueToday = state.orders.filter((o) =>
      o.delivery?.date >= today && o.delivery?.date < today + 86400000 && o.status !== 'cancel');
    const revenue = state.orders
      .filter((o) => o.status === 'done')
      .reduce((n, o) => n + o.total, 0);
    stats.replaceChildren(
      stat(String(open.length), 'سفارش باز', open.length ? 'نیازمند اقدام' : 'همه بسته'),
      stat(String(dueToday.length), 'تحویل امروز',
        dueToday.length ? nextSlot(dueToday) : '—'),
      stat(money(revenue).replace(' تومان', ''), 'فروش تحویل‌شده', 'تومان'),
      stat(String(customers().length), 'مشتری', 'ثبت‌شده'),
    );
  }

  function paint() {
    paintStats();
    body.replaceChildren();

    if (tab === 'people') return body.append(people());
    if (tab === 'stock') return body.append(stock());

    let list = state.orders.slice();
    if (tab === 'today') {
      const t = startOfDay();
      list = list.filter((o) => o.delivery?.date >= t && o.delivery?.date < t + 86400000
        && o.status !== 'cancel')
        .sort((a, b) => DELIVERY.slots.indexOf(a.delivery.slot) - DELIVERY.slots.indexOf(b.delivery.slot));
    } else {
      list = list.filter((o) => o.status === tab);
    }

    if (!list.length) {
      body.append(empty('box', 'چیزی اینجا نیست',
        tab === 'today' ? 'امروز تحویلی ثبت نشده.' : 'این ستون خالی است.'));
      return;
    }
    list.forEach((o) => body.append(orderCard(o, paint)));
  }

  paint();
  return v;
}

/* ------------------------------------------------------------- the card */
function orderCard(o, refresh) {
  const zone = DELIVERY.zones.find((z) => z.id === o.delivery?.zone);
  const card = el('div', { class: 'ord' });

  card.append(el('div', { class: 'ord__top' },
    el('div', { style: { minWidth: '0' } },
      el('div', { class: 'ord__id', dir: 'ltr', style: { textAlign: 'start' }, text: o.no }),
      el('div', { class: 'ord__who', text: o.recipient?.name || '—' }),
      el('div', { class: 'ord__meta',
        text: `${o.items.map((i) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join('، ')} · ${money(o.total)}` }),
    ),
    el('span', { class: 'ord__st', data: { s: o.status }, text: STATUS[o.status].name }),
  ));

  card.append(el('div', { class: 'ord__meta' },
    `${faShort(o.delivery.date)} · ${o.delivery.slot} · ${zone?.name || '—'}`));
  card.append(el('div', { class: 'ord__meta', text: o.recipient?.address || '' }));

  const acts = el('div', { class: 'ord__acts' });
  const flow = { new: 'prep', prep: 'out', out: 'done' };
  if (flow[o.status]) {
    acts.append(el('button', {
      class: 'chip', type: 'button',
      text: `→ ${STATUS[flow[o.status]].name}`,
      onclick: () => { setStatus(o.id, flow[o.status]); haptic(); toast('وضعیت به‌روز شد'); refresh(); },
    }));
  }
  acts.append(el('a', { class: 'chip', href: telHref(o.recipient?.phone || '') },
    el('span', { html: icon('phone'), style: { display: 'contents' } }), 'گیرنده'));
  acts.append(el('a', { class: 'chip', href: telHref(o.buyer?.phone || '') },
    el('span', { html: icon('user'), style: { display: 'contents' } }), 'سفارش‌دهنده'));
  acts.append(el('button', {
    class: 'chip', type: 'button', text: 'جزئیات',
    onclick: () => detail(o, refresh),
  }));
  card.append(acts);
  return card;
}

function detail(o, refresh) {
  sheet((close) => {
    const box = el('div', {});
    box.append(el('h2', { id: 'sheet-title',
      style: { fontSize: '18px', fontWeight: '600', marginBottom: '3px' },
      text: `سفارش ${o.no}` }));
    box.append(el('p', { class: 'muted tiny', style: { marginBottom: '16px' },
      text: faDateTime(o.at) }));

    o.items.forEach((i) => {
      const meta = [];
      if (i.size) meta.push(`اندازه ${SIZES.find((s) => s.id === i.size)?.name || i.size}`);
      if (i.qty > 1) meta.push(`${i.qty} عدد`);
      (i.addons || []).forEach((a) => {
        const ad = ADDONS.find((x) => x.id === a); if (ad) meta.push(ad.name);
      });
      box.append(el('div', { class: 'line' },
        el('div', { class: 'line__ph' },
          photo(i.slug === 'custom' ? 'arghavan' : i.slug, { alt: i.name, sizes: '80px' })),
        el('div', { class: 'line__b' },
          el('div', { class: 'line__t', text: i.name }),
          meta.length ? el('div', { class: 'line__s', text: meta.join(' · ') }) : null,
          i.note ? el('div', { class: 'line__s',
            style: { whiteSpace: 'normal' }, text: `کارت: «${i.note}»` }) : null,
          el('div', { class: 'line__f' }, el('span'),
            el('div', { class: 'line__p', text: money(i.price * i.qty) })),
        )));
      if (i.brief) box.append(briefBlock(i.brief));
    });

    box.append(el('hr', { class: 'hr' }));
    box.append(el('dl', {},
      kv('سفارش‌دهنده', `${o.buyer?.name} — ${prettyPhone(o.buyer?.phone || '')}`),
      kv('گیرنده', `${o.recipient?.name} — ${prettyPhone(o.recipient?.phone || '')}`),
      kv('آدرس', o.recipient?.address || '—'),
      kv('زمان', `${faShort(o.delivery.date)} · ${o.delivery.slot}`),
      kv('پرداخت', { card: 'کارت به کارت', cash: 'هنگام تحویل', link: 'لینک پرداخت' }[o.pay] || '—'),
      o.anon ? kv('فرستنده', 'ناشناس') : null,
      kv('جمع', money(o.total)),
    ));

    box.append(el('div', { class: 'eyebrow', style: { margin: '18px 0 10px' }, text: 'Status' }));
    const row = el('div', { class: 'chips', style: { paddingInline: '0', marginInline: '0' } });
    Object.entries(STATUS).forEach(([k, s]) => {
      row.append(el('button', {
        class: 'chip' + (o.status === k ? ' is-on' : ''), type: 'button', text: s.name,
        onclick: () => {
          setStatus(o.id, k);
          [...row.children].forEach((c) => c.classList.remove('is-on'));
          haptic(); toast('وضعیت به‌روز شد'); refresh(); close();
        },
      }));
    });
    box.append(row);
    return box;
  });
}

/* ---------------------------------------------------------- the people */
function people() {
  const list = customers();
  if (!list.length) return empty('users', 'هنوز مشتری‌ای ثبت نشده', 'با اولین سفارش اینجا پر می‌شود.');
  const panel = el('div', { class: 'panel' });
  const rows = el('div', { class: 'rows' });
  list.forEach((c) => {
    rows.append(el('a', { class: 'row row--btn', href: telHref(c.phone) },
      el('div', { class: 'row__ic', html: icon('user') }),
      el('div', { class: 'row__b' },
        el('div', { class: 'row__t', text: c.name }),
        el('div', { class: 'row__s',
          text: `${prettyPhone(c.phone)} · ${c.n} سفارش · آخرین ${relative(c.last)}` })),
      el('div', { class: 'row__e', text: money(c.spend) }),
    ));
  });
  panel.append(rows);
  return panel;
}

/* ----------------------------------------------------------- the stock */
function stock() {
  const panel = el('div', { class: 'panel' },
    el('div', { class: 'panel__t', text: 'موجودی امروز' }),
    el('div', { class: 'panel__s',
      text: 'هرچه خاموش شود، در سایت «موجود نیست» می‌خورد و دکمه سفارشش غیرفعال می‌شود.' }),
  );
  const rows = el('div', { class: 'rows' });
  PRODUCTS.forEach((p) => {
    const box = el('span', { class: 'sw__box' + (state.stock[p.slug] ? ' is-on' : '') });
    rows.append(el('button', {
      class: 'sw', type: 'button', style: { width: '100%' },
      'aria-pressed': String(!!state.stock[p.slug]),
      onclick: (e) => {
        const on = toggleStock(p.slug);
        box.classList.toggle('is-on', on);
        e.currentTarget.setAttribute('aria-pressed', String(on));
        haptic();
        toast(`${p.name} ${on ? 'موجود شد' : 'ناموجود شد'}`);
      },
    },
      el('span', { style: { textAlign: 'start' } },
        el('span', { class: 'sw__t', style: { display: 'block' }, text: p.name }),
        el('span', { class: 'sw__s', style: { display: 'block' }, text: money(p.price) })),
      box));
  });
  panel.append(rows);
  return panel;
}

/* ------------------------------------------------------------ the lock */
function lockScreen() {
  const v = el('div', { class: 'view' });
  const box = el('div', { class: 'lock' });

  box.append(brandEl('word', ''));
  box.firstChild.style.width = '116px';
  box.append(el('div', {},
    el('h1', { style: { fontSize: '19px', fontWeight: '600' }, text: 'ورود کارکنان' }),
    el('p', { class: 'muted tiny', style: { marginTop: '6px' }, text: 'رمز چهار رقمی آتلیه' }),
  ));

  const pin = el('div', { class: 'pin' });
  const cells = [];
  for (let i = 0; i < 4; i += 1) {
    const c = el('input', {
      type: 'tel', inputmode: 'numeric', maxlength: '1', 'aria-label': `رقم ${i + 1}`,
      autocomplete: 'off',
      oninput: (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 1);
        if (e.target.value && cells[i + 1]) cells[i + 1].focus();
        check();
      },
      onkeydown: (e) => {
        if (e.key === 'Backspace' && !e.target.value && cells[i - 1]) cells[i - 1].focus();
      },
    });
    cells.push(c); pin.append(c);
  }
  box.append(pin);

  const err = el('div', { class: 'err', hidden: true, text: 'رمز درست نیست.' });
  box.append(err);
  box.append(el('a', { class: 'tiny muted', href: '#/', text: 'بازگشت به سایت' }));

  function check() {
    const v2 = cells.map((c) => c.value).join('');
    if (v2.length < 4) return;
    if (v2 === BRAND.crmPin) {
      state.crm.unlocked = true; save();
      haptic(14);
      go('/crm');
    } else {
      err.hidden = false;
      pin.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' },
         { transform: 'translateX(7px)' }, { transform: 'translateX(0)' }],
        { duration: 260, easing: 'ease-out' });
      cells.forEach((c) => { c.value = ''; });
      cells[0].focus();
    }
  }

  setTimeout(() => cells[0].focus(), 260);
  v.append(box);
  return v;
}

/* ---------------------------------------------------------------- glue */
const kv = (k, val) => (val === null || val === undefined ? null
  : el('div', { class: 'kv' }, el('dt', { text: k }), el('dd', { text: val })));

function stat(b, s, i) {
  return el('div', { class: 'stat' },
    el('b', { text: b }), el('span', { text: s }), i ? el('i', { text: i }) : null);
}

function startOfDay(d = new Date()) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime();
}

function nextSlot(list) {
  const s = list.map((o) => o.delivery.slot)
    .sort((a, b) => DELIVERY.slots.indexOf(a) - DELIVERY.slots.indexOf(b))[0];
  return s ? `اولین: ${s}` : '—';
}
