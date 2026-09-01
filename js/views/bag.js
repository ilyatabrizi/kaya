import { el, money, haptic } from '../util.js';
import { icon } from '../icons.js';
import { SIZES, ADDONS, DELIVERY } from '../config.js';
import { photo, pageHead, footer, empty, qtyControl, toast, note } from '../ui.js';
import { go } from '../router.js';
import { state, setQty, bagTotal, bagCount } from '../store.js';

export default function bag() {
  const v = el('div', { class: 'view page' });
  const wrap = el('div', { class: 'wrap wrap--tight' });
  wrap.append(pageHead('سبد', bagCount() ? null : undefined));

  if (!state.bag.length) {
    wrap.append(empty('bag', 'سبد خالی است',
      'یکی از قطعه‌های کایا را انتخاب کنید، یا سفارش اختصاصی بدهید.',
      el('div', { style: { display: 'flex', gap: '9px', flexWrap: 'wrap',
                           justifyContent: 'center', marginTop: '6px' } },
        el('a', { class: 'btn btn--sm', href: '#/shop', text: 'دیدن گل‌ها' }),
        el('a', { class: 'btn btn--sm btn--ghost', href: '#/custom', text: 'سفارش اختصاصی' }),
      )));
    v.append(wrap, footer());
    return v;
  }

  const listPanel = el('div', { class: 'panel' });
  const lines = el('div', {});
  listPanel.append(lines);
  wrap.append(listPanel);

  const totals = el('div', { class: 'panel' });
  wrap.append(totals);

  wrap.append(note('کرایه ارسال در مرحله بعد و بر اساس منطقه محاسبه می‌شود.', 'truck'));

  const cta = el('a', { class: 'btn btn--full btn--lg mt-l', href: '#/checkout' },
    'ادامه و تعیین زمان تحویل',
    el('span', { html: icon('chev'), style: { display: 'contents' } }));
  wrap.append(cta);

  function paint() {
    lines.replaceChildren();
    if (!state.bag.length) { go('/bag'); return; }

    state.bag.forEach((l) => {
      const meta = [];
      if (l.size) meta.push(`اندازه ${SIZES.find((s) => s.id === l.size)?.name || l.size}`);
      (l.addons || []).forEach((a) => {
        const ad = ADDONS.find((x) => x.id === a);
        if (ad) meta.push(ad.name);
      });
      if (l.summary) meta.push(l.summary);

      const row = el('div', { class: 'line' },
        el('a', { class: 'line__ph', href: l.custom ? '#/custom' : `#/p/${l.slug}` },
          photo(l.photo, { alt: l.name, sizes: '80px' })),
        el('div', { class: 'line__b' },
          el('div', { class: 'line__t', text: l.name }),
          meta.length ? el('div', { class: 'line__s', text: meta.join(' · ') }) : null,
          l.note ? el('div', { class: 'line__s', text: `کارت: «${l.note}»` }) : null,
          l.estimate ? el('div', { class: 'line__s',
            style: { color: 'var(--ink-2)' }, text: 'قیمت تخمینی — بعد از تماس نهایی می‌شود' }) : null,
          el('div', { class: 'line__f' },
            qtyControl(l.qty, (n) => { setQty(l.id, n); haptic(); paint(); }),
            el('div', { class: 'line__p', text: money(l.price * l.qty) }),
          ),
        ),
      );
      lines.append(row);
    });

    const sub = bagTotal();
    totals.replaceChildren(
      el('dl', {},
        row2('جمع اقلام', money(sub)),
        row2('کرایه ارسال', 'مرحله بعد'),
        sub >= DELIVERY.freeOver
          ? row2('تخفیف ارسال', 'رایگان — سفارش بالای ' + money(DELIVERY.freeOver))
          : null,
        el('div', { class: 'kv kv--total' },
          el('dt', { text: 'جمع' }), el('dd', { text: money(sub) })),
      ),
    );
  }

  const row2 = (k, val) => el('div', { class: 'kv' },
    el('dt', { text: k }), el('dd', { text: val }));

  paint();
  v.append(wrap, footer());
  return v;
}
