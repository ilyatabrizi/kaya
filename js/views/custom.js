// The bespoke brief.
//
// Six steps, one decision each. It does not price the arrangement — a florist
// cannot, from a form — it produces a brief the shop can read down a phone
// line, and quotes back. Saying so on the last screen is what makes the whole
// thing honest rather than a fake checkout.

import { el, money, haptic, scrollTop, validPhone } from '../util.js';
import { icon } from '../icons.js';
import { OCCASIONS, FORMS, PALETTES, FLOWERS, BUDGETS, WRAPS } from '../data.js';
import { pageHead, footer, toast, note } from '../ui.js';
import { go } from '../router.js';
import { addToBag, state, saveProfile } from '../store.js';

const STEPS = ['Occasion', 'Form', 'Palette', 'Flowers', 'Budget', 'Details'];

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

  wrap.append(pageHead('Bespoke',
    'Six short steps. At the end, KAYA arranges the piece and confirms the final price with you before anything is made.'));

  const bar = el('div', { class: 'steps' }, ...STEPS.map(() => el('i')));
  wrap.append(bar);

  const label = el('div', {
    class: 'eyebrow eyebrow--ink', style: { marginBottom: '10px' },
  });
  const title = el('h2', {
    class: 'display',
    style: { fontSize: 'clamp(20px,4.6px,26px)', fontWeight: '600',
             letterSpacing: '-.01em', marginBottom: '6px' },
  });
  const sub = el('p', {
    class: 'muted', style: { fontSize: '13.5px', marginBottom: '20px' },
  });
  const body = el('div', {});
  wrap.append(label, title, sub, body);

  const back = el('button', {
    class: 'btn btn--ghost', type: 'button', text: 'Back',
    onclick: () => { step -= 1; render(); },
  });
  const next = el('button', {
    class: 'btn', type: 'button',
    onclick: () => {
      if (step < STEPS.length - 1) { step += 1; render(); }
      else submit();
    },
  }, el('span', { text: 'Next' }));
  const nav = el('div', {
    style: { display: 'flex', gap: '10px', marginTop: '26px' },
  }, back, next);
  wrap.append(nav);

  v.append(wrap, footer());

  /* ------------------------------------------------------------- render */
  function render() {
    [...bar.children].forEach((i, k) => {
      i.classList.toggle('is-done', k < step);
      i.classList.toggle('is-on', k === step);
    });
    label.textContent = `Step ${step + 1} / ${STEPS.length}`;
    body.replaceChildren();
    back.style.visibility = step === 0 ? 'hidden' : '';
    next.firstChild.textContent = step === STEPS.length - 1 ? 'Send the brief' : 'Next';
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
    title.textContent = 'What is the occasion?';
    sub.textContent = 'This one choice steers the palette and the form.';
    body.append(pickGrid(OCCASIONS,
      (o) => brief.occasion === o.id,
      (o) => { brief.occasion = o.id; }));
  }

  function stepForm() {
    title.textContent = 'In what form?';
    sub.textContent = 'Not sure? Take “Bouquet” — it can change later.';
    body.append(pickGrid(FORMS,
      (f) => brief.form === f.id,
      (f) => { brief.form = f.id; }));
  }

  function stepPalette() {
    title.textContent = 'Which palette?';
    sub.textContent = 'KAYA arranges inside this range and tunes the exact shades to the day’s flowers.';
    body.append(pickGrid(PALETTES,
      (p) => brief.palette === p.id,
      (p) => { brief.palette = p.id; },
      (p) => el('span', {
        class: 'opt__sw',
        style: { background: `linear-gradient(100deg, ${p.hex.join(', ')})` },
      })));
  }

  function stepFlowers() {
    title.textContent = 'Which flowers?';
    sub.textContent = 'Pick a few. Whatever you leave out, KAYA fills with the freshest of that day.';
    body.append(pickGrid(FLOWERS,
      (f) => brief.flowers.has(f.id),
      (f) => {
        if (brief.flowers.has(f.id)) brief.flowers.delete(f.id);
        else brief.flowers.add(f.id);
      }));
    body.append(el('div', { class: 'tiny muted', style: { marginTop: '12px' },
      text: 'Leaving this empty is fine — it means KAYA chooses.' }));
  }

  function stepBudget() {
    title.textContent = 'Around what budget?';
    sub.textContent = 'Not a final number — just the range to arrange within.';

    const out = el('div', {
      style: { fontSize: '27px', fontWeight: '700', letterSpacing: '-.02em',
               textAlign: 'center', margin: '10px 0 2px' },
    });
    const hint = el('div', { class: 'tiny muted center', style: { marginBottom: '18px' } });
    const rng = el('input', {
      class: 'rng', type: 'range', min: '0', max: String(BUDGETS.length - 1),
      step: '1', value: String(brief.budget), 'aria-label': 'Budget',
      oninput: (e) => { brief.budget = Number(e.target.value); paint(); },
    });
    function paint() {
      const b = BUDGETS[brief.budget];
      out.textContent = money(b);
      hint.textContent = brief.budget === BUDGETS.length - 1
        ? 'and above — call for the largest pieces'
        : `up to about ${money(BUDGETS[brief.budget + 1])}`;
    }
    paint();
    body.append(out, hint, rng);
    body.append(el('div', {
      style: { display: 'flex', justifyContent: 'space-between',
               fontSize: '11px', color: 'var(--faint)' },
    }, el('span', { text: money(BUDGETS[0]) }),
       el('span', { text: money(BUDGETS[BUDGETS.length - 1]) + '+' })));

    body.append(el('div', { class: 'panel mt-l' },
      el('div', { class: 'panel__t', text: 'Paper or box colour' }),
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
    title.textContent = 'The last details';
    sub.textContent = 'Everything you write here lands on the atelier’s order sheet, word for word.';

    body.append(field('Your name', el('input', {
      class: 'inp', value: brief.name, placeholder: 'e.g. Sara Mahdavi',
      autocomplete: 'name',
      oninput: (e) => { brief.name = e.target.value; validate(); },
    })));

    const phone = el('input', {
      class: 'inp', type: 'tel', inputmode: 'numeric',
      value: brief.phone, placeholder: '09xx xxx xxxx', autocomplete: 'tel',
      oninput: (e) => { brief.phone = e.target.value; validate(); },
    });
    const phoneErr = el('div', { class: 'err', hidden: true, text: 'That doesn’t look like a valid mobile number.' });
    body.append(field('Phone', phone, 'For confirming the price and the delivery time.', phoneErr));

    body.append(field('Ribbon text', el('input', {
      class: 'inp', maxlength: '48', value: brief.ribbon,
      placeholder: 'e.g. Congratulations — Artan Co.',
      oninput: (e) => { brief.ribbon = e.target.value; },
    }), 'Optional. Up to 48 characters, printed on satin.'));

    body.append(field('Card message', el('textarea', {
      class: 'inp', maxlength: '240', text: brief.message,
      placeholder: 'A message, written in a fine hand on the card',
      oninput: (e) => { brief.message = e.target.value; },
    }), 'Optional. No charge.'));

    body.append(field('Anything else?', el('textarea', {
      class: 'inp', maxlength: '400', text: brief.notes,
      placeholder: 'e.g. the recipient is sensitive to strong scent, or it must arrive before 10 am',
      oninput: (e) => { brief.notes = e.target.value; },
    })));

    body.append(summary());
    body.append(note('This is a request, not a charge. KAYA reads the brief, calls you with a final price, and starts arranging only after you agree.', 'info'));

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
    const fl = [...brief.flowers].map((f) => nameOf(FLOWERS, f)).join(', ');
    return el('div', { class: 'panel mt-l' },
      el('div', { class: 'panel__t', text: 'Your brief' }),
      el('dl', {},
        kv('Occasion', nameOf(OCCASIONS, brief.occasion)),
        kv('Form', nameOf(FORMS, brief.form)),
        kv('Palette', nameOf(PALETTES, brief.palette)),
        kv('Flowers', fl || 'KAYA’s choice'),
        kv('Paper / box', nameOf(WRAPS, brief.wrap)),
        kv('Budget', money(BUDGETS[brief.budget])),
      ),
    );
  }

  const kv = (k, val) => el('dl', { class: 'kv', style: { margin: '0' } },
    el('dt', { text: k }), el('dd', { text: val }));

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
      `${nameOf(PALETTES, brief.palette)} palette`,
    ];
    const flowers = [...brief.flowers].map((f) => nameOf(FLOWERS, f));

    saveProfile({ name: brief.name.trim(), phone: validPhone(brief.phone) });

    addToBag({
      slug: 'custom',
      name: 'Bespoke arrangement',
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
        flowers: flowers.length ? flowers.join(', ') : 'KAYA’s choice',
        budget: BUDGETS[brief.budget],
        ribbon: brief.ribbon,
        message: brief.message,
        notes: brief.notes,
      },
      summary: parts.join(' · '),
    });

    haptic(14);
    toast('Your brief is in the bag');
    go('/bag');
  }

  render();
  return v;
}
