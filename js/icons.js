// Inline SVG. Stroked, 24-grid, 1.5 weight — the CSS sets colour and size.
// A sprite sheet would be fewer bytes; strings are fewer moving parts, and
// the whole set is under 3KB.

const paths = {
  home: '<path d="M3.6 10.3 12 3.8l8.4 6.5V20a1 1 0 0 1-1 1h-4.6v-6.2H9.2V21H4.6a1 1 0 0 1-1-1z"/>',
  flower: '<path d="M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Z"/><path d="M12 8.6c0-2.4-1-4.6-2.4-4.6S7.4 5.5 8.9 7.5M12 8.6c0-2.4 1-4.6 2.4-4.6s1.6 1.5.7 3.5M8.9 10.4c-2.2-1-4.6-1-5 .5s1.7 2.5 3.9 2.3M15.1 10.4c2.2-1 4.6-1 5 .5s-1.7 2.5-3.9 2.3"/><path d="M12 15.4V21"/>',
  spark: '<path d="M12 3.2 13.7 9l5.8 1.7-5.8 1.7L12 18.2l-1.7-5.8L4.5 10.7 10.3 9z"/><path d="M18.6 16.4l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7z"/>',
  bag: '<path d="M5.4 8h13.2l-.9 11.3a2 2 0 0 1-2 1.8H8.3a2 2 0 0 1-2-1.8z"/><path d="M8.8 10.4V6.9a3.2 3.2 0 0 1 6.4 0v3.5"/>',
  user: '<path d="M12 12.2a3.9 3.9 0 1 0 0-7.8 3.9 3.9 0 0 0 0 7.8Z"/><path d="M4.6 20.4c.6-3.7 3.7-5.9 7.4-5.9s6.8 2.2 7.4 5.9"/>',
  heart: '<path d="M12 20.2S3.8 15.4 3.8 9.9A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 8.2 2.3c0 5.5-8.2 10.3-8.2 10.3Z"/>',
  back: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  fwd: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
  chev: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
  down: '<path d="M6 9.5 12 15.5 18 9.5"/>',
  check: '<path d="M4.8 12.6 9.6 17.4 19.2 6.6"/>',
  plus: '<path d="M12 5.4v13.2M5.4 12h13.2"/>',
  minus: '<path d="M5.4 12h13.2"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  phone: '<path d="M6.3 3.9h3.1l1.6 3.9-2 1.2a10.9 10.9 0 0 0 5 5l1.2-2 3.9 1.6v3.1a2 2 0 0 1-2.2 2A16.9 16.9 0 0 1 4.3 6.1a2 2 0 0 1 2-2.2Z"/>',
  pin: '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><path d="M12 12.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z"/>',
  clock: '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M12 7.2V12l3.2 2"/>',
  cal: '<rect x="3.6" y="5.2" width="16.8" height="15.2" rx="2.4"/><path d="M3.6 9.8h16.8M8.4 3.4v3.4M15.6 3.4v3.4"/>',
  ig: '<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="5"/><path d="M12 15.9a3.9 3.9 0 1 0 0-7.8 3.9 3.9 0 0 0 0 7.8Z"/><path d="M16.9 7.3h.01"/>',
  truck: '<path d="M2.8 6.6h10.6v10.2H2.8z"/><path d="M13.4 10.2h3.7l3.1 3v3.6h-6.8z"/><path d="M7 20a1.9 1.9 0 1 0 0-3.8A1.9 1.9 0 0 0 7 20ZM17.4 20a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z"/>',
  box: '<path d="M3.6 7.6 12 3.4l8.4 4.2v8.8L12 20.6l-8.4-4.2z"/><path d="M3.6 7.6 12 11.8l8.4-4.2M12 11.8v8.8"/>',
  gift: '<rect x="3.4" y="8.4" width="17.2" height="4.4" rx="1"/><path d="M4.8 12.8h14.4v6.6a1.4 1.4 0 0 1-1.4 1.4H6.2a1.4 1.4 0 0 1-1.4-1.4z"/><path d="M12 8.4v12.4"/><path d="M12 8.4S10.6 3.4 8.2 3.4a2.5 2.5 0 0 0 0 5zM12 8.4s1.4-5 3.8-5a2.5 2.5 0 0 1 0 5z"/>',
  note: '<path d="M5.4 3.8h9.2l4 4v12.4a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2V5.8a2 2 0 0 1 2-2Z"/><path d="M14.2 3.8v4.4h4.4M7.6 13h8.8M7.6 16.8h5.6"/>',
  chart: '<path d="M4 20V10M9.4 20V4.6M14.8 20v-7.4M20.2 20V8"/>',
  users: '<path d="M9.2 11.6a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z"/><path d="M2.6 20c.5-3.4 3.3-5.4 6.6-5.4S15.3 16.6 15.8 20"/><path d="M16.4 4.8a3.6 3.6 0 0 1 0 6.9M18 14.9c2.1.5 3.3 2.3 3.6 4.4"/>',
  lock: '<rect x="4.6" y="10.4" width="14.8" height="10" rx="2.4"/><path d="M8 10.4V7.6a4 4 0 0 1 8 0v2.8"/>',
  cog: '<path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"/><path d="M19.1 14.4a1.6 1.6 0 0 0 .3 1.7l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a1.9 1.9 0 1 1-3.8 0v-.1a1.6 1.6 0 0 0-2.8-1.1l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.6 1.6 0 0 0-1.1-2.7h-.2a1.9 1.9 0 1 1 0-3.8h.1a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1.6 1.6 0 0 0 1.7.3h.1a1.6 1.6 0 0 0 1-1.5v-.2a1.9 1.9 0 1 1 3.8 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.6 1.6 0 0 0-.3 1.7v.1a1.6 1.6 0 0 0 1.5 1h.2a1.9 1.9 0 1 1 0 3.8h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
  info: '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M12 16.2v-4.8M12 7.9h.01"/>',
  share: '<path d="M17.4 8.4a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2ZM6.6 14.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2ZM17.4 20.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z"/><path d="m8.9 13.3 6.2 3.6M15.1 7.1 8.9 10.7"/>',
  trash: '<path d="M3.9 6.4h16.2M8.4 6.4V4.6a1.4 1.4 0 0 1 1.4-1.4h4.4a1.4 1.4 0 0 1 1.4 1.4v1.8M18 6.4l-.8 13a1.4 1.4 0 0 1-1.4 1.3H8.2a1.4 1.4 0 0 1-1.4-1.3l-.8-13"/>',
  edit: '<path d="M15.6 4.2 19.8 8.4 8.6 19.6l-4.6.9.9-4.6z"/>',
  install: '<path d="M12 3.8v11M7.6 10.4 12 14.8l4.4-4.4"/><path d="M4.4 16.6v2.2a1.8 1.8 0 0 0 1.8 1.8h11.6a1.8 1.8 0 0 0 1.8-1.8v-2.2"/>',
  search: '<path d="M11 18.2a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4ZM20.4 20.4l-4.3-4.3"/>',
  leaf: '<path d="M4.2 19.8c0-8 5-13.4 15.6-14-.4 10.4-5.6 15.4-13.6 15.4M4.6 19.4c2.4-3.6 5.8-6.4 9.8-8.2"/>',
  ribbon: '<path d="M12 13.6a5.1 5.1 0 1 0 0-10.2 5.1 5.1 0 0 0 0 10.2Z"/><path d="m9 12.9-2.6 7.7 5.6-3 5.6 3-2.6-7.7"/>',
};

// Every icon carries `ic`, which is what actually gives it fill:none and a
// stroke. Without it an icon dropped somewhere with no matching svg rule
// renders as a filled black blob — which is what the order-confirmation tick
// did, invisibly, on a black circle.
export function icon(name, cls = '') {
  const p = paths[name] || paths.info;
  return `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
}

export function iconEl(name, cls = '') {
  const span = document.createElement('span');
  span.style.display = 'contents';
  span.innerHTML = icon(name, cls);
  return span.firstElementChild;
}
