// The bespoke brief.
//
// Six steps, one decision each. It does not price the arrangement — a florist
// cannot, from a form — it produces a brief the shop can read down a phone
// line, and quotes back. Saying so on the last screen is what makes the whole
// thing honest rather than a fake checkout.

import { el, money, haptic, scrollTop, validPhone } from '../util.js';
import { icon } from '../icons.js';
import { OCCASIONS, FORMS, PALETTES, FLOWERS, BUDGETS, WRAPS } from '../data.js';
import { BRAND } from '../config.js';
import { pageHead, footer, toast, note } from '../ui.js';
import { go } from '../router.js';
import { addToBag, state, saveProfile } from '../store.js';

const STEPS = ['مناسبت', 'فرم', 'رنگ', 'گل‌ها', 'بودجه', 'جزئیات'];

export default function custom() {
  const brief = {
    occasion: null, form: null, palette: null,
    flowers: new Set(), budget: 3, wrap: 'black',
    ribbon: '', message: '', notes: '',
    name: state.profile.name || '', phone: state.profile.phone || '',
  };
  let step = 0;

  const v = el('div', { class: 'view page' });
  const wrap = el('div', { class: 'wrap wrap--tight' });

  wrap.append(pageHead('سفارش اختصاصی',
    'شش قدم کوتاه. در پایان، کایا ترکیب را می‌چیند و قیمت نهایی را قبل از آماده‌سازی با شما هماهنگ می‌کند.'));

  const bar = el('div', { class: 'steps' }, ...STEPS.map(() => el('i')));
  wrap.append(bar);

  const label = el('div', {
    class: 'eyebrow eyebrow--ink', style: { marginBottom: '10px' },
  });
  const title = el('h2', {
    style: { fontSize: 'clamp(19px,4.4vw,24px)', fontWeight: '600',
             letterSpacing: '-.02em', marginBottom: '6px' },
  });
  const sub = el('p', {
    class: 'muted', style: { fontSize: '13.5px', marginBottom: '20px' },
  });
  const body = el('div', {});
  wrap.append(label, title, sub, body);

  const back = el('button', {
    class: 'btn btn--ghost', type: 'button', text: 'قبلی',
    onclick: () => { step -= 1; render(); },
  });
  const next = el('button', {
    class: 'btn', type: 'button',
    onclick: () => {
      if (step < STEPS.length - 1) { step += 1; render(); }
      else submit();
    },
  }, el('span', { text: 'بعدی' }));
  const nav = el('div', {
    style: { display: 'flex', gap: '10px', marginTop: '26px' },
  }, back, next);
  wrap.append(nav);

  v.append(wrap, footer());

  /* ------------------------------------------------------------- render */
  function render() {
    [...bar.children].forEach((i, n) => {
      i.classList.toggle('is-done', n < step);
      i.classList.toggle('is-on', n === step);
    });
    label.textContent = `Step ${step + 1} / ${STEPS.length}`;
    body.replaceChildren();
    back.style.visibility = step === 0 ? 'hidden' : '';
    next.firstChild.textContent = step === STEPS.length - 1 ? 'ثبت درخواست' : 'بعدی';
    ({
      0: stepOccasion, 1: stepForm, 2: stepPalette,
      3: stepFlowers, 4: stepBudget, 5: stepDetails,
    })[step]();
    validate();
    scrollTop();
  }

  function pickGrid(items, isOn, onPick, render3) {
    const g = el('div', { class: 'opts' });
    items.forEach((it) => {
      const o = el('button', {
        class: 'opt' + (isOn(it) ? ' is-on' : ''), type: 'button',
        onclick: () => { onPick(it); haptic(); sync(); validate(); },
      }, el('span', { class: 'opt__ck', html: icon('check') }));
      if (render3) o.append(render3(it));
      o.append(el('span', { class: 'opt__t', text: it.name }));
      if (it.sub) o.append(el('span', { class: 'opt__s', text: it.sub }));
      g.append(o);
    });
    function sync() {
      [...g.children].forEach((c, i) => c.classList.toggle('is-on', isOn(items[i])));
    }
    return g;
  }

  /* -------------------------------------------------------------- steps */
  function stepOccasion() {
    title.textContent = 'مناسبت چیست؟';
    sub.textContent = 'همین یک انتخاب، پالت و فرم پیشنهادی را جهت می‌دهد.';
    body.append(pickGrid(OCCASIONS,
      (o) => brief.occasion === o.id,
      (o) => { brief.occasion = o.id; }));
  }

  function stepForm() {
    title.textContent = 'در چه فرمی؟';
    sub.textContent = 'اگر مطمئن نیستید، «دسته‌گل» را بزنید — بعداً قابل تغییر است.';
    body.append(pickGrid(FORMS,
      (f) => brief.form === f.id,
      (f) => { brief.form = f.id; }));
  }

  function stepPalette() {
    title.textContent = 'چه رنگی؟';
    sub.textContent = 'کایا در همین طیف می‌چیند و تناژ دقیق را با گل موجود آن روز تنظیم می‌کند.';
    body.append(pickGrid(PALETTES,
      (p) => brief.palette === p.id,
      (p) => { brief.palette = p.id; },
      (p) => el('span', {
        class: 'opt__sw',
        style: { background: `linear-gradient(100deg, ${p.hex.join(', ')})` },
      })));
  }

  function stepFlowers() {
    title.textContent = 'کدام گل‌ها باشند؟';
    sub.textContent = 'چند تا انتخاب کنید. هر چه انتخاب نکنید را کایا با گل تازه همان روز پر می‌کند.';
    body.append(pickGrid(FLOWERS,
      (f) => brief.flowers.has(f.id),
      (f) => {
        if (brief.flowers.has(f.id)) brief.flowers.delete(f.id);
        else brief.flowers.add(f.id);
      }));
    body.append(el('div', { class: 'tiny muted', style: { marginTop: '12px' },
      text: 'خالی گذاشتن هم اشکالی ندارد — یعنی انتخاب با کایا.' }));
  }

  function stepBudget() {
    title.textContent = 'حدود چه بودجه‌ای؟';
    sub.textContent = 'عدد نهایی نیست؛ فقط بگویید در چه محدوده‌ای می‌چینیم.';

    const out = el('div', {
      style: { fontSize: '27px', fontWeight: '700', letterSpacing: '-.02em',
               textAlign: 'center', margin: '10px 0 2px' },
    });
    const hint = el('div', { class: 'tiny muted center', style: { marginBottom: '18px' } });
    const rng = el('input', {
      class: 'rng', type: 'range', min: '0', max: String(BUDGETS.length - 1),
      step: '1', value: String(brief.budget), 'aria-label': 'بودجه',
      oninput: (e) => { brief.budget = Number(e.target.value); paint(); },
    });
    function paint() {
      const b = BUDGETS[brief.budget];
      out.textContent = money(b);
      hint.textContent = brief.budget === BUDGETS.length - 1
        ? 'و بالاتر — برای قطعه‌های بزرگ تماس بگیرید'
        : `تا حدود ${money(BUDGETS[brief.budget + 1])}`;
    }
    paint();
    body.append(out, hint, rng);
    body.append(el('div', {
      style: { display: 'flex', justifyContent: 'space-between',
               fontSize: '11px', color: 'var(--faint)' },
    }, el('span', { text: money(BUDGETS[0]) }),
       el('span', { text: money(BUDGETS[BUDGETS.length - 1]) + '+' })));

    body.append(el('div', { class: 'panel mt-l' },
      el('div', { class: 'panel__t', text: 'رنگ کاغذ یا جعبه' }),
      el('div', { class: 'chips', style: { paddingInline: '0', marginInline: '0', marginTop: '10px' } },
        ...WRAPS.map((w) => {
          const c = el('button', {
            class: 'chip' + (brief.wrap === w.id ? ' is-on' : ''), type: 'button',
            onclick: () => {
              brief.wrap = w.id;
              [...c.parentElement.children].forEach((x, i) =>
                x.classList.toggle('is-on', WRAPS[i].id === brief.wrap));
              haptic();
            },
          },
            el('span', {
              style: { width: '14px', height: '14px', borderRadius: '99px',
                       background: w.hex, border: '1px solid rgba(11,11,12,.15)',
                       display: 'inline-block', flex: 'none' },
            }),
            w.name);
          return c;
        })),
    ));
  }

  function stepDetails() {
    title.textContent = 'جزئیات آخر';
    sub.textContent = 'هر چه بنویسید مستقیم روی برگه سفارش آتلیه می‌نشیند.';

    body.append(field('نام شما', el('input', {
      class: 'inp', value: brief.name, placeholder: 'مثلاً سارا مهدوی',
      autocomplete: 'name',
      oninput: (e) => { brief.name = e.target.value; validate(); },
    })));

    const phone = el('input', {
      class: 'inp', type: 'tel', dir: 'ltr', inputmode: 'numeric',
      value: brief.phone, placeholder: '09xxxxxxxxx', autocomplete: 'tel',
      oninput: (e) => { brief.phone = e.target.value; validate(); },
    });
    const phoneErr = el('div', { class: 'err', hidden: true, text: 'شماره موبایل معتبر نیست.' });
    body.append(field('شماره تماس', phone, 'برای هماهنگی قیمت و زمان تحویل.', phoneErr));

    body.append(field('متن ریبون', el('input', {
      class: 'inp', maxlength: '48', value: brief.ribbon,
      placeholder: 'مثلاً: افتتاح مبارک — شرکت آرتان',
      oninput: (e) => { brief.ribbon = e.target.value; },
    }), 'اختیاری. حداکثر ۴۸ حرف روی ریبون ساتن چاپ می‌شود.'));

    body.append(field('متن کارت', el('textarea', {
      class: 'inp', maxlength: '240', text: brief.message,
      placeholder: 'پیامی که با خط خوش روی کارت نوشته شود',
      oninput: (e) => { brief.message = e.target.value; },
    }), 'اختیاری. بدون هزینه.'));

    body.append(field('توضیح دیگری هست؟', el('textarea', {
      class: 'inp', maxlength: '400', text: brief.notes,
      placeholder: 'مثلاً: گیرنده به عطر گل حساس است، یا باید قبل از ساعت ۱۰ برسد',
      oninput: (e) => { brief.notes = e.target.value; },
    })));

    body.append(summary());
    body.append(note('این درخواست هنوز سفارش قطعی نیست. کایا بعد از خواندن آن تماس می‌گیرد، قیمت نهایی را می‌گوید و بعد از تأیید شما آماده‌سازی شروع می‌شود.', 'info'));

    // validate() needs these to show/hide the error.
    body._phone = phone; body._phoneErr = phoneErr;
  }

  function field(labelText, input, hint, err) {
    const f = el('div', { class: 'field' });
    const lid = 'f' + Math.random().toString(36).slice(2, 7);
    input.id = lid;
    f.append(el('label', { for: lid, text: labelText }), input);
    if (hint) f.append(el('div', { class: 'field__hint', text: hint }));
    if (err) f.append(err);
    return f;
  }

  function summary() {
    const nameOf = (list, id) => list.find((x) => x.id === id)?.name || '—';
    const fl = [...brief.flowers].map((f) => nameOf(FLOWERS, f)).join('، ');
    const p = el('div', { class: 'panel mt-l' },
      el('div', { class: 'panel__t', text: 'خلاصه درخواست' }),
      el('dl', {},
        kv('مناسبت', nameOf(OCCASIONS, brief.occasion)),
        kv('فرم', nameOf(FORMS, brief.form)),
        kv('پالت رنگ', nameOf(PALETTES, brief.palette)),
        kv('گل‌ها', fl || 'انتخاب با کایا'),
        kv('کاغذ / جعبه', nameOf(WRAPS, brief.wrap)),
        kv('بودجه', money(BUDGETS[brief.budget])),
      ),
    );
    return p;
  }

  const kv = (k, v) => el('dl', { class: 'kv', style: { margin: '0' } },
    el('dt', { text: k }), el('dd', { text: v }));

  /* ----------------------------------------------------------- validate */
  function validate() {
    let ok = true;
    if (step === 0) ok = !!brief.occasion;
    if (step === 1) ok = !!brief.form;
    if (step === 2) ok = !!brief.palette;
    if (step === 5) {
      const good = validPhone(brief.phone);
      ok = brief.name.trim().length > 1 && !!good;
      if (body._phoneErr) {
        const show = brief.phone.length > 3 && !good;
        body._phoneErr.hidden = !show;
        body._phone.setAttribute('aria-invalid', show ? 'true' : 'false');
      }
    }
    next.disabled = !ok;
  }

  /* ------------------------------------------------------------- submit */
  function submit() {
    const nameOf = (list, x) => list.find((i) => i.id === x)?.name || '—';
    const parts = [
      nameOf(OCCASIONS, brief.occasion),
      nameOf(FORMS, brief.form),
      `پالت ${nameOf(PALETTES, brief.palette)}`,
    ];
    const flowers = [...brief.flowers].map((f) => nameOf(FLOWERS, f));

    saveProfile({ name: brief.name.trim(), phone: validPhone(brief.phone) });

    addToBag({
      slug: 'custom',
      name: 'سفارش اختصاصی',
      photo: 'arghavan',
      custom: true,
      size: null,
      addons: [],
      price: BUDGETS[brief.budget],
      estimate: true,
      note: brief.message,
      brief: {
        occasion: nameOf(OCCASIONS, brief.occasion),
        form: nameOf(FORMS, brief.form),
        palette: nameOf(PALETTES, brief.palette),
        wrap: nameOf(WRAPS, brief.wrap),
        flowers: flowers.length ? flowers.join('، ') : 'انتخاب با کایا',
        budget: BUDGETS[brief.budget],
        ribbon: brief.ribbon,
        message: brief.message,
        notes: brief.notes,
      },
      summary: parts.join(' · '),
    });

    haptic(14);
    toast('درخواست شما در سبد ثبت شد');
    go('/bag');
  }

  render();
  return v;
}
