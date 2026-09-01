import { el, money, dateTime, dateShort, relative, prettyPhone } from '../util.js';
import { icon } from '../icons.js';
import { DELIVERY, BRAND, SIZES, ADDONS } from '../config.js';
import { pageHead, footer, empty, note, photo } from '../ui.js';
import { currentRoute, go } from '../router.js';
import { state, STATUS } from '../store.js';

const FLOW = ['new', 'prep', 'out', 'done'];

export function ordersList() {
  const v = el('div', { class: 'view page' });
  const wrap = el('div', { class: 'wrap wrap--tight' });
  wrap.append(pageHead('My orders', 'Every order placed from this device.'));

  const mine = state.orders.filter((o) => !o.demo || o.buyer?.phone === state.profile.phone);
  const list = mine.length ? mine : state.orders.filter((o) => !o.demo);

  if (!list.length) {
    wrap.append(empty('note', 'No orders yet',
      'Your first order will be trackable here.',
      el('a', { class: 'btn btn--sm mt', href: '#/shop', text: 'See the pieces' })));
  } else {
    const panel = el('div', { class: 'panel' });
    const rows = el('div', { class: 'rows' });
    list.forEach((o) => {
      rows.append(el('a', { class: 'row row--btn', href: `#/order/${o.id}` },
        el('div', { class: 'row__ic', html: icon('box') }),
        el('div', { class: 'row__b' },
          el('div', { class: 'row__t', text: o.items.map((i) => i.name).join(', ') }),
          el('div', { class: 'row__s',
            text: `${o.no} · ${relative(o.at)} · ${money(o.total)}` })),
        el('div', { class: 'row__e' },
          el('span', { class: 'ord__st', data: { s: o.status }, text: STATUS[o.status].name })),
      ));
    });
    panel.append(rows);
    wrap.append(panel);
  }

  v.append(wrap, footer());
  return v;
}

export function orderDetail() {
  const { oid } = currentRoute().params;
  const o = state.orders.find((x) => x.id === oid);
  if (!o) { go('/orders', { replace: true }); return el('div'); }

  const v = el('div', { class: 'view page' });
  const wrap = el('div', { class: 'wrap wrap--tight' });

  const isNew = Date.now() - o.at < 15000;

  /* ------------------------------------------------------------- header */
  if (isNew) {
    wrap.append(el('div', {
      class: 'center', style: { padding: '10px 0 26px' },
    },
      el('div', {
        style: { width: '62px', height: '62px', margin: '0 auto 16px',
                 borderRadius: '999px', background: 'var(--ink)', color: '#fff',
                 display: 'grid', placeItems: 'center' },
        html: icon('check'),
      }),
      el('h1', { class: 'display',
        style: { fontSize: '26px', fontWeight: '600', letterSpacing: '-.01em' },
        text: 'Order placed' }),
      el('p', { class: 'muted', style: { fontSize: '13.5px', marginTop: '7px' },
        text: 'KAYA will call you shortly to confirm.' }),
    ));
  } else {
    wrap.append(pageHead(`Order ${o.no}`, dateTime(o.at)));
  }

  /* ------------------------------------------------------------ tracker */
  if (o.status !== 'cancel') {
    const at = FLOW.indexOf(o.status);
    const track = el('div', { class: 'panel' },
      el('div', { class: 'panel__t', text: 'Status' }),
      el('div', { class: 'steps', style: { marginTop: '12px', marginBottom: '12px' } },
        ...FLOW.map((s, i) => {
          const bar = el('i');
          if (i <= at) bar.classList.add('is-done');
          return bar;
        })),
      el('div', { style: { display: 'flex', justifyContent: 'space-between',
                           fontSize: '11px', color: 'var(--faint)' } },
        ...FLOW.map((s, i) => el('span', {
          text: STATUS[s].name,
          style: { color: i <= at ? 'var(--ink)' : '', fontWeight: i === at ? '600' : '400' },
        }))),
    );
    wrap.append(track);
  } else {
    wrap.append(note('This order was cancelled.', 'info'));
  }

  /* -------------------------------------------------------------- items */
  const items = el('div', { class: 'panel' },
    el('div', { class: 'panel__t', text: 'Items' }));
  o.items.forEach((i) => {
    const meta = [];
    if (i.size) meta.push(SIZES.find((s) => s.id === i.size)?.name || i.size);
    if (i.qty > 1) meta.push(`× ${i.qty}`);
    (i.addons || []).forEach((a) => {
      const ad = ADDONS.find((x) => x.id === a); if (ad) meta.push(ad.name);
    });
    items.append(el('div', { class: 'line' },
      el('div', { class: 'line__ph' }, photo(i.slug === 'custom' ? 'arghavan' : i.slug,
        { alt: i.name, sizes: '80px' })),
      el('div', { class: 'line__b' },
        el('div', { class: 'line__t', text: i.name }),
        meta.length ? el('div', { class: 'line__s', text: meta.join(' · ') }) : null,
        i.note ? el('div', { class: 'line__s', text: `Card: “${i.note}”` }) : null,
        el('div', { class: 'line__f' },
          el('span', {}), el('div', { class: 'line__p', text: money(i.price * i.qty) })),
      ),
    ));
    if (i.brief) items.append(briefBlock(i.brief));
  });
  wrap.append(items);

  /* ----------------------------------------------------------- delivery */
  const zone = DELIVERY.zones.find((z) => z.id === o.delivery.zone);
  wrap.append(el('div', { class: 'panel' },
    el('div', { class: 'panel__t', text: 'Delivery' }),
    el('div', { class: 'rows' },
      infoRow('cal', 'When', `${dateShort(o.delivery.date)} · ${o.delivery.slot}`),
      infoRow('truck', 'How', `${zone?.name || '—'}`),
      infoRow('user', 'Recipient', `${o.recipient.name} — ${prettyPhone(o.recipient.phone)}`),
      infoRow('pin', 'Address', o.recipient.address),
    ),
  ));

  /* ------------------------------------------------------------- totals */
  wrap.append(el('div', { class: 'panel' },
    el('dl', {},
      el('div', { class: 'kv' }, el('dt', { text: 'Items' }),
        el('dd', { text: money(o.total - (o.delivery.fee || 0)) })),
      el('div', { class: 'kv' }, el('dt', { text: 'Delivery' }),
        el('dd', { text: o.delivery.fee ? money(o.delivery.fee) : 'free' })),
      el('div', { class: 'kv kv--total' }, el('dt', { text: 'Total' }),
        el('dd', { text: money(o.total) })),
    ),
  ));

  wrap.append(el('div', { class: 'panel' },
    el('div', { class: 'rows' },
      el('a', { class: 'row row--btn', href: 'tel:' + BRAND.phones[0] },
        el('div', { class: 'row__ic', html: icon('phone') }),
        el('div', { class: 'row__b' },
          el('div', { class: 'row__t', text: 'Call the atelier' }),
          el('div', { class: 'row__s', text: prettyPhone(BRAND.phones[0]) })),
        el('div', { class: 'row__e', html: icon('chev') })),
      el('button', {
        class: 'row row--btn', type: 'button',
        onclick: async () => {
          const text = `KAYA order ${o.no}\n${o.items.map((i) => i.name).join(', ')}\n${money(o.total)}`;
          if (navigator.share) { try { await navigator.share({ title: 'KAYA order', text }); } catch { /* cancelled */ } }
          else { await navigator.clipboard?.writeText(text); }
        },
      },
        el('div', { class: 'row__ic', html: icon('share') }),
        el('div', { class: 'row__b' }, el('div', { class: 'row__t', text: 'Share the order' })),
        el('div', { class: 'row__e', html: icon('chev') })),
    ),
  ));

  wrap.append(el('div', { style: { display: 'flex', gap: '10px', marginTop: '18px' } },
    el('a', { class: 'btn btn--ghost', href: '#/orders', text: 'My orders',
      style: { flex: '1' } }),
    el('a', { class: 'btn', href: '#/shop', text: 'Keep shopping', style: { flex: '1' } }),
  ));

  v.append(wrap, footer());
  return v;
}

function infoRow(ic, t, s) {
  return el('div', { class: 'row' },
    el('div', { class: 'row__ic', html: icon(ic) }),
    el('div', { class: 'row__b' },
      el('div', { class: 'row__t', text: t }),
      el('div', { class: 'row__s', style: { whiteSpace: 'normal' }, text: s })),
  );
}

export function briefBlock(b) {
  const rows = [
    ['Occasion', b.occasion], ['Form', b.form], ['Palette', b.palette],
    ['Flowers', b.flowers], ['Paper', b.wrap],
    ['Budget', money(b.budget)],
    b.ribbon ? ['Ribbon', b.ribbon] : null,
    b.notes ? ['Notes', b.notes] : null,
  ].filter(Boolean);
  return el('div', { class: 'note', style: { marginTop: '12px', display: 'block' } },
    el('div', { class: 'eyebrow', style: { marginBottom: '9px' }, text: 'Brief' }),
    ...rows.map(([k, val]) => el('div', { class: 'kv', style: { padding: '4px 0' } },
      el('dt', { text: k }), el('dd', { text: val }))),
  );
}
