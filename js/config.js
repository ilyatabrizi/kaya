// Everything the client owns and might change, in one file.
// Prices, hours and the catalogue copy are placeholders pending the client's
// own numbers — see README, "What is real and what is placeholder".

export const BRAND = {
  name: 'KAYA',
  tagline: 'Flower atelier',
  city: 'Tabriz',
  area: 'Valiasr',
  address: 'Valiasr, Tabriz',
  instagram: 'kaya_flwr',
  instagramUrl: 'https://instagram.com/kaya_flwr',
  // Two lines. The first is the one that rings during the day.
  phones: ['09308805590', '09142163696'],
  hours: [
    { d: 'Saturday – Wednesday', h: '9:00 – 21:00' },
    { d: 'Thursday & Friday', h: '9:00 – 22:00' },
  ],
  // Staff-only panel. K‑A‑Y‑A on a phone keypad.
  crmPin: '5292',
};

export const DELIVERY = {
  // Tabriz only, for now.
  zones: [
    { id: 'central', name: 'Central Tabriz', sub: 'Valiasr, El Goli, Abrasan, Eram', fee: 90000, eta: 'under 2 hours' },
    { id: 'wide', name: 'Greater Tabriz', sub: 'outside the central district', fee: 150000, eta: '2–4 hours' },
    { id: 'pickup', name: 'Pickup at the atelier', sub: 'Valiasr — we call when it is ready', fee: 0, eta: 'by arrangement' },
  ],
  slots: ['9–12', '12–15', '15–18', '18–21'],
  freeOver: 5000000,
};

export const ADDONS = [
  { id: 'card', name: 'Handwritten card', sub: 'your message, in a fine hand', price: 0 },
  { id: 'ribbon', name: 'Printed KAYA ribbon', sub: 'a name or message on satin', price: 180000 },
  { id: 'vase', name: 'Upgrade to the KAYA ceramic urn', sub: 'white, with the gilded wordmark', price: 1200000 },
  { id: 'choc', name: 'Box of chocolates', sub: 'dark, twelve pieces', price: 850000 },
];

export const SIZES = [
  { id: 's', name: 'Petite', sub: 'for a desk or console', mult: 1 },
  { id: 'm', name: 'Classic', sub: "KAYA's recommendation", mult: 1.45 },
  { id: 'l', name: 'Grand', sub: 'twice the volume, reads across a room', mult: 2.1 },
];
