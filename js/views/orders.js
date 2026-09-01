import { el, money, faDateTime, relative, prettyPhone } from '../util.js';
import { icon } from '../icons.js';
import { DELIVERY, BRAND } from '../config.js';
import { SIZES, ADDONS } from '../config.js';
import { pageHead, footer, empty, note, photo, brandEl } from '../ui.js';
import { currentRoute, go, back } from '../router.js';
import { state, STATUS } from '../store.js';

const FLOW = ['new', 'prep', 'out', 'done'];

export function ordersList() {
  const v = el('div', { class: 'view page' });
  const wrap = el('div', { class: 'wrap wrap--tight' });
  wrap.append(pageHead('سفارش‌های من', 'همه سفارش‌هایی که از این دستگاه ثبت شده.'));

  const mine = state.orders.filter((o) => !o.demo || o.buyer?.phone === state.profile.phone);
  const list = mine.length ? mine : state.orders.filter((o) => !o.demo);

  if (!list.length) {
    wrap.append(empty('note', 'هنوز سفارشی ندارید',
      'اولین سفارشتان که ثبت شود، اینجا قابل پیگیری است.',
      el('a', { class: 'btn btn--sm mt', href: '#/shop', text: 'دیدن گل‌ها' })));
  } else {
    const panel = el('div', { class: 'panel' });
    const rows = el('div', { class: 'rows' });
    list.forEach((o) => {
      rows.append(el('a', { class: 'row row--btn', href: `#/order/${o.id}` },
        el('div', { class: 'row__ic', html: icon('box') }),
        el('div', { class: 'row__b' },
          el('div', { class: 'row__t', text: o.items.map((i) => i.name).join('، ') }),
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
      el('h1', { style: { fontSize: '24px', fontWeight: '600', letterSpacing: '-.02em' },
        text: 'سفارش شما ثبت شد' }),
      el('p', { class: 'muted', style: { fontSize: '13.5px', marginTop: '7px' },
        text: 'کایا تا دقایقی دیگر برای هماهنگی تماس می‌گیرد.' }),
    ));
  } else {
    wrap.append(pageHead(`سفارش ${o.no}`, faDateTime(o.at)));
  }

  /* ------------------------------------------------------------ tracker */
  if (o.status !== 'cancel') {
    const at = FLOW.indexOf(o.status);
    const track = el('div', { class: 'panel' },
      el('div', { class: 'panel__t', text: 'وضعیت' }),
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
    wrap.append(note('این سفارش لغو شده است.', 'info'));
  }

  /* -------------------------------------------------------------- items */
  const items = el('div', { class: 'panel' },
    el('div', { class: 'panel__t', text: 'اقلام' }));
  o.items.forEach((i) => {
    const meta = [];
    if (i.size) meta.push(`اندازه ${SIZES.find((s) => s.id === i.size)?.name || i.size}`);
    if (i.qty > 1) meta.push(`${i.qty} عدد`);
    (i.addons || []).forEach((a) => {
      const ad = ADDONS.find((x) => x.id === a); if (ad) meta.push(ad.name);
    });
    items.append(el('div', { class: 'line' },
      el('div', { class: 'line__ph' }, photo(i.slug === 'custom' ? 'arghavan' : i.slug,
        { alt: i.name, sizes: '80px' })),
      el('div', { class: 'line__b' },
        el('div', { class: 'line__t', text: i.name }),
        meta.length ? el('div', { class: 'line__s', text: meta.join(' · ') }) : null,
        i.note ? el('div', { class: 'line__s', text: `کارت: «${i.note}»` }) : null,
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
    el('div', { class: 'panel__t', text: 'تحویل' }),
    el('div', { class: 'rows' },
      infoRow('cal', 'زمان', `${faDateTime(o.delivery.date).split('·')[0].trim()} · ${o.delivery.slot}`),
      infoRow('truck', 'روش', `${zone?.name || '—'}`),
      infoRow('user', 'گیرنده', `${o.recipient.name} — ${prettyPhone(o.recipient.phone)}`),
      infoRow('pin', 'آدرس', o.recipient.address),
    ),
  ));

  /* ------------------------------------------------------------ totals */
  wrap.append(el('div', { class: 'panel' },
    el('dl', {},
      el('div', { class: 'kv' }, el('dt', { text: 'جمع اقلام' }),
        el('dd', { text: money(o.total - (o.delivery.fee || 0)) })),
      el('div', { class: 'kv' }, el('dt', { text: 'کرایه ارسال' }),
        el('dd', { text: o.delivery.fee ? money(o.delivery.fee) : 'رایگان' })),
      el('div', { class: 'kv kv--total' }, el('dt', { text: 'جمع' }),
        el('dd', { text: money(o.total) })),
    ),
  ));

  wrap.append(el('div', { class: 'panel' },
    el('div', { class: 'rows' },
      el('a', { class: 'row row--btn', href: 'tel:' + BRAND.phones[0] },
        el('div', { class: 'row__ic', html: icon('phone') }),
        el('div', { class: 'row__b' },
          el('div', { class: 'row__t', text: 'تماس با آتلیه' }),
          el('div', { class: 'row__s', dir: 'ltr', text: prettyPhone(BRAND.phones[0]) })),
        el('div', { class: 'row__e', html: icon('chev') })),
      el('button', {
        class: 'row row--btn', type: 'button',
        onclick: async () => {
          const text = `سفارش ${o.no} — کایا\n${o.items.map((i) => i.name).join('، ')}\n${money(o.total)}`;
          if (navigator.share) { try { await navigator.share({ title: 'سفارش کایا', text }); } catch { /* cancelled */ } }
          else { await navigator.clipboard?.writeText(text); }
        },
      },
        el('div', { class: 'row__ic', html: icon('share') }),
        el('div', { class: 'row__b' }, el('div', { class: 'row__t', text: 'اشتراک‌گذاری سفارش' })),
        el('div', { class: 'row__e', html: icon('chev') })),
    ),
  ));

  wrap.append(el('div', { style: { display: 'flex', gap: '10px', marginTop: '18px' } },
    el('a', { class: 'btn btn--ghost', href: '#/orders', text: 'سفارش‌های من',
      style: { flex: '1' } }),
    el('a', { class: 'btn', href: '#/shop', text: 'ادامه خرید', style: { flex: '1' } }),
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
    ['مناسبت', b.occasion], ['فرم', b.form], ['پالت', b.palette],
    ['گل‌ها', b.flowers], ['کاغذ', b.wrap],
    ['بودجه', money(b.budget)],
    b.ribbon ? ['ریبون', b.ribbon] : null,
    b.notes ? ['توضیح', b.notes] : null,
  ].filter(Boolean);
  return el('div', { class: 'note', style: { marginTop: '12px', display: 'block' } },
    el('div', { class: 'eyebrow', style: { marginBottom: '9px' }, text: 'Brief' }),
    ...rows.map(([k, val]) => el('div', { class: 'kv', style: { padding: '4px 0' } },
      el('dt', { text: k }), el('dd', { text: val }))),
  );
}
