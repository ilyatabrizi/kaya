import { el, money } from '../util.js';
import { icon } from '../icons.js';
import { PRODUCTS, CATS } from '../data.js';
import { BRAND, DELIVERY } from '../config.js';
import { photo, productCard, sectionHead, footer, brandEl } from '../ui.js';
import { heroSection } from '../hero.js';
import { state } from '../store.js';

export default function home() {
  const v = el('div', { class: 'view' });

  v.append(heroSection());

  /* ------------------------------------------------------- the shortcuts */
  const quick = el('section', { class: 'sect sect--tight' },
    el('div', { class: 'wrap' },
      el('div', { class: 'rail', style: { gridAutoColumns: 'minmax(132px,38vw)' } },
        tile('flower', 'گل‌ها', 'هفت قطعه آماده', '#/shop'),
        tile('spark', 'سفارش اختصاصی', 'از صفر، با شما', '#/custom'),
        tile('ribbon', 'استند تبریک', 'افتتاحیه و تبریک', '#/shop?c=stand'),
        tile('truck', 'ارسال در تبریز', 'کمتر از ۲ ساعت', '#/about'),
      ),
    ),
  );
  v.append(quick);

  /* ----------------------------------------------------------- the shelf */
  const shelf = el('section', { class: 'sect' });
  const wrap = el('div', { class: 'wrap' });
  wrap.append(sectionHead(
    'قطعه‌های کایا',
    'هر ترکیب همان روز چیده می‌شود. آنچه در عکس می‌بینید همان چیزی است که تحویل می‌گیرید.',
    { href: '#/shop', text: 'همه' },
  ));

  const grid = el('div', { class: 'grid' });
  // One landscape photograph among seven portraits. It spans the full row, so
  // it has to sit at a row boundary — anywhere else it pushes the cards before
  // it into a short row and leaves a hole, and the boundary is at a different
  // index for each of the 2-, 3- and 4-column layouts. First is the only
  // index that is a boundary in all three.
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
              text: 'گلی که فقط برای شما بسته می‌شود',
              style: { fontSize: 'clamp(21px,4.6vw,27px)', fontWeight: '600',
                       letterSpacing: '-.02em', margin: '10px 0 9px' },
            }),
            el('p', {
              class: 'muted',
              style: { fontSize: '14px', lineHeight: '1.9', maxWidth: '40ch' },
              text: 'مناسبت، فرم، پالت رنگ، گل‌های اصلی و بودجه را انتخاب کنید. کایا ترکیب را می‌چیند و قبل از آماده‌سازی، قیمت نهایی را با شما هماهنگ می‌کند.',
            }),
            el('a', { class: 'btn mt', href: '#/custom' },
              'شروع سفارش اختصاصی',
              el('span', { html: icon('chev'), style: { display: 'contents' } })),
          ),
          el('div', { class: 'custom-split__ph' },
            photo('arghavan', { alt: 'ترکیب بنفش کایا', sizes: '(min-width:760px) 420px, 100vw' })),
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
          promise('truck', 'ارسال در تبریز',
            `مرکز شهر ${DELIVERY.zones[0].eta} · سایر مناطق ${DELIVERY.zones[1].eta}`),
          promise('leaf', 'گل تازه، هر روز صبح',
            'هیچ ترکیبی از روز قبل نمی‌ماند. اگر گلی نباشد، جایگزین را قبل از آماده‌سازی می‌گوییم.'),
          promise('note', 'کارت دست‌نویس',
            'متن شما با خط خوش روی کارت کایا نوشته می‌شود — بدون هزینه.'),
          promise('phone', 'هماهنگی قبل از تحویل',
            'قبل از حرکت پیک، با گیرنده تماس می‌گیریم تا گل پشت در نماند.'),
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
          style: { fontSize: '13.5px', margin: '16px auto 0', maxWidth: '34ch' },
          text: `${BRAND.address}. برای دیدن قطعه‌ها و مشورت، بدون وقت قبلی سر بزنید.`,
        }),
        el('div', {
          style: { display: 'flex', gap: '9px', justifyContent: 'center',
                   flexWrap: 'wrap', marginTop: '18px' },
        },
          el('a', { class: 'btn btn--sm', href: 'tel:' + BRAND.phones[0] },
            el('span', { html: icon('phone'), style: { display: 'contents' } }), 'تماس'),
          el('a', {
            class: 'btn btn--sm btn--ghost', href: BRAND.instagramUrl,
            target: '_blank', rel: 'noopener',
          }, el('span', { html: icon('ig'), style: { display: 'contents' } }),
             el('span', { dir: 'ltr', class: 'lat', text: '@' + BRAND.instagram })),
          el('a', { class: 'btn btn--sm btn--ghost', href: '#/about' }, 'ساعت کار و آدرس'),
        ),
      ),
    ),
  );
  v.append(visit);

  v.append(footer());
  return v;
}

function tile(ic, title, sub, href) {
  return el('a', {
    class: 'qtile', href,
  },
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
