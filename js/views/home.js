import { el } from '../util.js';
import { icon } from '../icons.js';
import { PRODUCTS } from '../data.js';
import { BRAND, DELIVERY } from '../config.js';
import { photo, productCard, sectionHead, footer, brandEl } from '../ui.js';
import { heroSection } from '../hero.js';

export default function home() {
  const v = el('div', { class: 'view' });

  v.append(heroSection());

  /* ------------------------------------------------------- the shortcuts */
  const quick = el('section', { class: 'sect sect--tight' },
    el('div', { class: 'wrap' },
      el('div', { class: 'rail', style: { gridAutoColumns: 'minmax(150px,40vw)' } },
        tile('flower', 'Shop', 'seven pieces, ready today', '#/shop'),
        tile('spark', 'Bespoke', 'from scratch, with you', '#/custom'),
        tile('ribbon', 'Stands', 'openings & congratulations', '#/shop?c=stand'),
        tile('truck', 'Delivery', 'across Tabriz, same day', '#/about'),
      ),
    ),
  );
  v.append(quick);

  /* ----------------------------------------------------------- the shelf */
  const shelf = el('section', { class: 'sect' });
  const wrap = el('div', { class: 'wrap' });
  wrap.append(sectionHead(
    'The pieces',
    'Arranged fresh the same day. What you see in the photograph is what arrives.',
    { href: '#/shop', text: 'All' },
  ));

  const grid = el('div', { class: 'grid' });
  // One landscape photograph among seven portraits. It spans the full row, so
  // it has to sit at a row boundary — and first is the only index that is a
  // boundary in the 2-, 3- and 4-column layouts alike.
  const wide = PRODUCTS.find((p) => p.slug === 'nilgoon');
  if (wide) grid.append(productCard(wide, { wide: true }));
  PRODUCTS.filter((p) => p !== wide).forEach((p) => grid.append(productCard(p)));
  wrap.append(grid);
  shelf.append(wrap);
  v.append(shelf);

  /* ---------------------------------------------------------- the custom */
  const custom = el('section', { class: 'sect' },
    el('div', { class: 'wrap' },
      el('div', { class: 'panel', style: { padding: '0', overflow: 'hidden' } },
        el('div', { class: 'custom-split' },
          el('div', { style: { padding: '26px 22px 24px' } },
            el('div', { class: 'eyebrow', text: 'Bespoke' }),
            el('h2', {
              class: 'display',
              text: 'Made only for you',
              style: { fontSize: 'clamp(22px,4.8vw,29px)', fontWeight: '600',
                       letterSpacing: '-.01em', margin: '10px 0 9px' },
            }),
            el('p', {
              class: 'muted',
              style: { fontSize: '14px', lineHeight: '1.9', maxWidth: '42ch' },
              text: 'Choose the occasion, the form, the palette, the flowers and the budget. KAYA arranges the piece and confirms the final price with you before anything is made.',
            }),
            el('a', { class: 'btn mt', href: '#/custom' },
              'Start a bespoke order',
              el('span', { html: icon('chev'), style: { display: 'contents' } })),
          ),
          el('div', { class: 'custom-split__ph' },
            photo('arghavan', { alt: 'A purple KAYA arrangement', sizes: '(min-width:760px) 420px, 100vw' })),
        ),
      ),
    ),
  );
  v.append(custom);

  /* --------------------------------------------------------- the promise */
  const prom = el('section', { class: 'sect sect--tight' },
    el('div', { class: 'wrap' },
      el('div', { class: 'panel' },
        el('div', { class: 'rows' },
          promise('truck', 'Delivery across Tabriz',
            `Central Tabriz ${DELIVERY.zones[0].eta} · elsewhere ${DELIVERY.zones[1].eta}`),
          promise('leaf', 'Fresh flowers, every morning',
            'No piece is held over from yesterday. If a flower is unavailable, we call before arranging and agree the substitute.'),
          promise('note', 'A handwritten card',
            'Your message, written in a fine hand on a KAYA card — no charge.'),
          promise('phone', 'A call before the courier moves',
            'We phone the recipient first, so flowers never wait at a door.'),
        ),
      ),
    ),
  );
  v.append(prom);

  /* --------------------------------------------------------------- visit */
  const visit = el('section', { class: 'sect' },
    el('div', { class: 'wrap' },
      el('div', { class: 'panel center', style: { padding: '34px 22px 30px' } },
        brandEl('word', 'visit__word'),
        el('p', {
          class: 'muted',
          style: { fontSize: '13.5px', margin: '16px auto 0', maxWidth: '38ch' },
          text: `${BRAND.address}. Come in to see the pieces or talk a brief through — no appointment needed.`,
        }),
        el('div', {
          style: { display: 'flex', gap: '9px', justifyContent: 'center',
                   flexWrap: 'wrap', marginTop: '18px' },
        },
          el('a', { class: 'btn btn--sm', href: 'tel:' + BRAND.phones[0] },
            el('span', { html: icon('phone'), style: { display: 'contents' } }), 'Call'),
          el('a', {
            class: 'btn btn--sm btn--ghost', href: BRAND.instagramUrl,
            target: '_blank', rel: 'noopener',
          }, el('span', { html: icon('ig'), style: { display: 'contents' } }),
             el('span', { text: '@' + BRAND.instagram })),
          el('a', { class: 'btn btn--sm btn--ghost', href: '#/about' }, 'Hours & address'),
        ),
      ),
    ),
  );
  v.append(visit);

  v.append(footer());
  return v;
}

function tile(ic, title, sub, href) {
  return el('a', { class: 'qtile', href },
    el('span', { class: 'qtile__ic', html: icon(ic) }),
    el('span', { class: 'qtile__t', text: title }),
    el('span', { class: 'qtile__s', text: sub }),
  );
}

function promise(ic, title, sub) {
  return el('div', { class: 'row' },
    el('div', { class: 'row__ic', html: icon(ic) }),
    el('div', { class: 'row__b' },
      el('div', { class: 'row__t', text: title }),
      el('div', {
        class: 'row__s',
        style: { whiteSpace: 'normal', lineHeight: '1.7' },
        text: sub,
      }),
    ),
  );
}
