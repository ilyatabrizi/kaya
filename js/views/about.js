import { el, prettyPhone, telHref, toman } from '../util.js';
import { icon } from '../icons.js';
import { BRAND, DELIVERY } from '../config.js';
import { pageHead, footer, brandEl, photo } from '../ui.js';

export default function about() {
  const v = el('div', { class: 'view page' });
  const wrap = el('div', { class: 'wrap wrap--tight' });

  wrap.append(pageHead('KAYA',
    'A flower atelier in Tabriz. Boxes and vases, bouquets, congratulation stands and bespoke arrangements.'));

  wrap.append(el('div', {
    style: { borderRadius: '26px', overflow: 'hidden', marginBottom: '24px' },
  }, photo('aftab', { alt: 'A KAYA arrangement in the ceramic urn', sizes: '(min-width:760px) 720px, 100vw' })));

  wrap.append(el('p', {
    style: { fontSize: '15px', lineHeight: '2', color: 'var(--ink-2)' },
    text: 'KAYA works to one rule: what you see in the photograph is what arrives. Every piece is arranged fresh on the day, and if a flower is not in the market that morning, we call before arranging and agree the substitute together.',
  }));

  wrap.append(el('div', { class: 'panel mt-l' },
    el('div', { class: 'panel__t', text: 'The atelier' }),
    el('div', { class: 'rows' },
      row('pin', 'Address', BRAND.address),
      ...BRAND.hours.map((h) => row('clock', h.d, h.h)),
    ),
  ));

  wrap.append(el('div', { class: 'panel' },
    el('div', { class: 'panel__t', text: 'Contact' }),
    el('div', { class: 'rows' },
      ...BRAND.phones.map((p) => el('a', { class: 'row row--btn', href: telHref(p) },
        el('div', { class: 'row__ic', html: icon('phone') }),
        el('div', { class: 'row__b' },
          el('div', { class: 'row__t', text: 'Call' }),
          el('div', { class: 'row__s', text: prettyPhone(p) })),
        el('div', { class: 'row__e', html: icon('chev') }))),
      el('a', {
        class: 'row row--btn', href: BRAND.instagramUrl, target: '_blank', rel: 'noopener',
      },
        el('div', { class: 'row__ic', html: icon('ig') }),
        el('div', { class: 'row__b' },
          el('div', { class: 'row__t', text: 'Instagram' }),
          el('div', { class: 'row__s', text: '@' + BRAND.instagram })),
        el('div', { class: 'row__e', html: icon('chev') })),
    ),
  ));

  wrap.append(el('div', { class: 'panel' },
    el('div', { class: 'panel__t', text: 'Delivery' }),
    el('div', { class: 'rows' },
      ...DELIVERY.zones.map((z) => el('div', { class: 'row' },
        el('div', { class: 'row__ic', html: icon(z.id === 'pickup' ? 'pin' : 'truck') }),
        el('div', { class: 'row__b' },
          el('div', { class: 'row__t', text: z.name }),
          el('div', { class: 'row__s', style: { whiteSpace: 'normal' },
            text: `${z.sub} · ${z.eta}` })),
        el('div', { class: 'row__e', text: z.fee ? toman(z.fee) : 'free' }),
      )),
    ),
    el('div', { class: 'note mt' },
      el('span', { html: icon('truck'), style: { display: 'contents' } }),
      el('span', { text: `Delivery is free across Tabriz on orders over ${toman(DELIVERY.freeOver)} Toman.` })),
  ));

  wrap.append(el('div', { class: 'panel' },
    el('div', { class: 'panel__t', text: 'Common questions' }),
    faq('How fast does it arrive?',
      'Usually under two hours in central Tabriz and two to four elsewhere in the city. For the largest pieces, like Hezar, order a day ahead.'),
    faq('Can I choose a delivery time?',
      'Yes. At checkout you pick a date and one of four time windows, and we call the recipient before the courier moves.'),
    faq('What if the recipient is not home?',
      'Flowers are never left at a door unagreed, and never returned. The courier calls, and if needed comes back the same day.'),
    faq('How do I pay?',
      'Card to card, a payment link, or on delivery. No card details are ever entered on this site.'),
    faq('Can I order my own arrangement?',
      'Yes — the Bespoke page is a six-step brief. KAYA reads it, calls you with a final price, and arranges only after you agree.'),
  ));

  wrap.append(el('div', { class: 'center', style: { padding: '30px 0 6px' } },
    brandEl('word', ''),
    el('p', { class: 'tiny muted', style: { marginTop: '14px' },
      text: `${BRAND.area}, ${BRAND.city}` }),
  ));
  wrap.lastChild.firstChild.style.width = '104px';
  wrap.lastChild.firstChild.style.margin = '0 auto';

  v.append(wrap, footer());
  return v;
}

function row(ic, t, s) {
  return el('div', { class: 'row' },
    el('div', { class: 'row__ic', html: icon(ic) }),
    el('div', { class: 'row__b' },
      el('div', { class: 'row__t', text: t }),
      el('div', { class: 'row__s', style: { whiteSpace: 'normal' }, text: s })),
  );
}

function faq(q, a) {
  const body = el('div', {
    style: { fontSize: '13px', color: 'var(--muted)', lineHeight: '1.9',
             overflow: 'hidden', height: '0', transition: 'height .34s cubic-bezier(.22,.61,.36,1)' },
  }, el('p', { style: { padding: '2px 0 12px' }, text: a }));

  let open = false;
  const head = el('button', {
    class: 'row row--btn', type: 'button', 'aria-expanded': 'false',
    style: { width: '100%' },
    onclick: () => {
      open = !open;
      head.setAttribute('aria-expanded', String(open));
      body.style.height = open ? `${body.scrollHeight}px` : '0';
      head.querySelector('.faq-chev').style.transform = open ? 'rotate(180deg)' : '';
    },
  },
    el('div', { class: 'row__b' },
      el('div', { class: 'row__t', style: { whiteSpace: 'normal' }, text: q })),
    el('div', { class: 'row__e faq-chev', html: icon('down'),
      style: { transition: 'transform .3s' } }),
  );
  return el('div', { style: { borderBottom: '1px solid var(--line-2)' } }, head, body);
}
