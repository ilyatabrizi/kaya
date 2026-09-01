// The catalogue.
//
// Seven pieces, one per photograph the client sent. Nothing here is
// illustrated with a photo that is not of that piece — a florist's customer
// buys the picture, and a stock image on a flower shop reads as a lie.
// The names are Persian words, kept — a Tabriz atelier should sound like one.
// Prices are placeholders until the client gives his own.

export const CATS = [
  { id: 'all', name: 'All' },
  { id: 'stand', name: 'Stands' },
  { id: 'vase', name: 'Box & vase' },
  { id: 'bouquet', name: 'Bouquets' },
];

export const PRODUCTS = [
  {
    slug: 'hezar-rose',
    name: 'Hezar',
    meaning: 'A thousand roses',
    cat: 'stand',
    price: 24000000,
    tag: 'Signature',
    photo: 'hezar-rose',
    short: 'A dome of red roses, KAYA ceramic urn',
    desc: 'A dome of Dutch red roses, each stem cut to the same height until the surface reads as one — set on the white KAYA ceramic urn with the gilded wordmark. Built for the moment a room stands up: openings, proposals, the anniversary that gets remembered.',
    stems: [
      { n: 'Dutch red roses', c: 'about 500 stems' },
      { n: 'KAYA ceramic urn', c: 'white, gilded wordmark' },
    ],
    dims: 'About 110 cm tall · 70 cm dome',
    care: 'Keep away from direct sun and vents; red roses hold ten days in a cool room.',
    lead: 'Order 24 hours ahead.',
    sizes: false,
  },
  {
    slug: 'sahar',
    name: 'Sahar',
    meaning: 'Daybreak',
    cat: 'stand',
    price: 8600000,
    photo: 'sahar',
    short: 'Pink roses, KAYA stone bowl',
    desc: 'Pink and lavender roses massed in a matte black stone bowl, finished with satin ribbons and KAYA cards. The scale reads from the doorway; the colour belongs to early morning.',
    stems: [
      { n: 'Pink roses', c: '60 stems' },
      { n: 'Lavender roses', c: '25 stems' },
      { n: 'Eucalyptus & greens', c: 'to balance' },
      { n: 'KAYA stone bowl', c: 'matte black' },
    ],
    dims: 'About 80 cm tall · 75 cm wide',
    care: 'Change the water every two days; recut the stems at an angle.',
    lead: 'Same day, ordered before 3 pm.',
    sizes: true,
  },
  {
    slug: 'banafsheh',
    name: 'Banafsheh',
    meaning: 'Violet',
    cat: 'stand',
    price: 6400000,
    photo: 'banafsheh',
    short: 'Opening stand, full palette',
    desc: 'The white KAYA stand carrying gladioli, purple lisianthus, anthurium and orange roses. Made for openings: it reads across a street, your name sits on the card, and the violet ribbon is the signature of the mix.',
    stems: [
      { n: 'Gladioli, purple & pink', c: '18 stems' },
      { n: 'Purple lisianthus', c: '20 stems' },
      { n: 'Anthurium', c: '6 stems' },
      { n: 'Orange roses & stock', c: 'to balance' },
      { n: 'KAYA white stand', c: 'collected afterwards' },
    ],
    dims: 'About 150 cm with the stand',
    care: 'Top up the reservoir daily; gladioli keep opening for a week.',
    lead: 'For openings, 12 hours ahead.',
    sizes: true,
  },
  {
    slug: 'arghavan',
    name: 'Arghavan',
    meaning: 'Redbud',
    cat: 'vase',
    price: 4800000,
    tag: 'Best seller',
    photo: 'arghavan',
    short: 'Purple anthurium, footed bowl',
    desc: 'Lacquer-purple anthurium against lisianthus, white roses and limonium, in a white footed bowl on a brass base. For an entry console or a desk that receives people — full from every angle, crowded from none.',
    stems: [
      { n: 'Purple anthurium', c: '7 stems' },
      { n: 'Lisianthus, purple & white', c: '24 stems' },
      { n: 'White roses', c: '12 stems' },
      { n: 'Limonium', c: 'to balance' },
      { n: 'Footed bowl, brass base', c: 'included' },
    ],
    dims: 'About 55 cm tall · 65 cm wide',
    care: 'Anthurium wants little water and indirect light; wipe the leaves with a damp cloth.',
    lead: 'Same day.',
    sizes: true,
  },
  {
    slug: 'aftab',
    name: 'Aftab',
    meaning: 'Sunlight',
    cat: 'vase',
    price: 3900000,
    photo: 'aftab',
    short: 'Orange lilies, KAYA ceramic urn',
    desc: 'Orange lilies and gladioli with peach anthurium and roses, in the white KAYA ceramic urn. When the lily buds open the piece grows by a third — this mix is arranged for its second week.',
    stems: [
      { n: 'Orange lilies', c: '9 stems' },
      { n: 'Gladioli', c: '15 stems' },
      { n: 'Peach anthurium', c: '5 stems' },
      { n: 'Spray roses & hydrangea', c: 'to balance' },
      { n: 'KAYA ceramic urn', c: 'gilded wordmark' },
    ],
    dims: 'About 90 cm tall · 70 cm wide',
    care: 'Pull the lily stamens as they open, so the pollen never marks a petal.',
    lead: 'Same day.',
    sizes: true,
  },
  {
    slug: 'nilgoon',
    name: 'Nilgoon',
    meaning: 'Azure',
    cat: 'bouquet',
    price: 2650000,
    photo: 'nilgoon',
    short: 'Blue roses, black anthurium',
    desc: 'Blue roses and orchids with black anthurium and orange roses, wrapped in matte black. The sharpest mix on the shelf, and the only one that leads with a cold colour. For someone who does not want ordinary flowers.',
    stems: [
      { n: 'Blue roses', c: '15 stems' },
      { n: 'Black anthurium', c: '9 stems' },
      { n: 'Orange roses', c: '12 stems' },
      { n: 'Peach roses & eucalyptus', c: 'to balance' },
    ],
    dims: 'About 50 cm across',
    care: 'The blue is a stable floral dye; keep it out of direct contact with water.',
    lead: 'Same day.',
    sizes: true,
  },
  {
    slug: 'shahd',
    name: 'Shahd',
    meaning: 'Nectar',
    cat: 'bouquet',
    price: 1980000,
    photo: 'shahd',
    short: 'Lilies and roses, amber palette',
    desc: 'Peach lilies, cream roses and stock in a palette that starts at orange and settles into old pink. The lightest piece on the shelf, and the one that carries the most scent.',
    stems: [
      { n: 'Peach lilies', c: '7 stems' },
      { n: 'Cream & peach roses', c: '18 stems' },
      { n: 'Stock', c: '10 stems' },
      { n: 'Spray roses', c: 'to balance' },
    ],
    dims: 'About 45 cm across',
    care: 'Stand in a tall vase, water to half the stem.',
    lead: 'Same day.',
    sizes: true,
  },
];

export const byslug = (s) => PRODUCTS.find((p) => p.slug === s);

/* ------------------------------------------------------- the bespoke brief */
// The bespoke page walks these six steps. Each answer is a plain id so the
// order that comes out the other end is readable by whoever picks up the
// phone at the shop.

export const OCCASIONS = [
  { id: 'birthday', name: 'Birthday' },
  { id: 'anniv', name: 'Anniversary' },
  { id: 'opening', name: 'Grand opening' },
  { id: 'congrats', name: 'Congratulations' },
  { id: 'love', name: 'Romance' },
  { id: 'thanks', name: 'Thank you' },
  { id: 'sympathy', name: 'Sympathy' },
  { id: 'none', name: 'Just because' },
];

export const FORMS = [
  { id: 'bouquet', name: 'Bouquet', sub: 'paper & ribbon' },
  { id: 'box', name: 'Box', sub: 'KAYA rigid box' },
  { id: 'vase', name: 'Vase', sub: 'ceramic or glass' },
  { id: 'stand', name: 'Stand', sub: 'for openings' },
  { id: 'basket', name: 'Basket', sub: 'handled, for gifting' },
  { id: 'dome', name: 'Rose dome', sub: 'the signature piece' },
];

export const PALETTES = [
  { id: 'white', name: 'White & green', hex: ['#FFFFFF', '#EDEFE8', '#9FB08C'] },
  { id: 'pink', name: 'Pink', hex: ['#F6D9DF', '#E8A0B4', '#C4718B'] },
  { id: 'red', name: 'Red', hex: ['#C1121F', '#8B0E18', '#F0C8C0'] },
  { id: 'amber', name: 'Amber & orange', hex: ['#F2A65A', '#E2703A', '#F6D8B8'] },
  { id: 'purple', name: 'Purple', hex: ['#7B4A9E', '#4E2B6B', '#C9A9DE'] },
  { id: 'blue', name: 'Blue', hex: ['#2E6FBF', '#123A6B', '#BBD3EC'] },
  { id: 'mixed', name: 'Full colour', hex: ['#E2703A', '#7B4A9E', '#F2C14E'] },
  { id: 'mono', name: 'All white', hex: ['#FFFFFF', '#F4F2EE', '#DFDBD4'] },
];

export const FLOWERS = [
  { id: 'rose', name: 'Rose' },
  { id: 'lily', name: 'Lily' },
  { id: 'anthurium', name: 'Anthurium' },
  { id: 'lisianthus', name: 'Lisianthus' },
  { id: 'gladiolus', name: 'Gladiolus' },
  { id: 'orchid', name: 'Orchid' },
  { id: 'hydrangea', name: 'Hydrangea' },
  { id: 'gerbera', name: 'Gerbera' },
  { id: 'tuberose', name: 'Tuberose' },
  { id: 'stock', name: 'Stock' },
  { id: 'chrys', name: 'Chrysanthemum' },
  { id: 'eucalyptus', name: 'Eucalyptus' },
];

// Budget rail for the bespoke brief. The step is coarse on purpose: the shop
// quotes the real number back after reading the brief.
export const BUDGETS = [
  1500000, 2500000, 3500000, 5000000, 7000000, 10000000, 15000000, 25000000,
];

export const WRAPS = [
  { id: 'black', name: 'Matte black', hex: '#141416' },
  { id: 'cream', name: 'Cream', hex: '#EFE7DA' },
  { id: 'white', name: 'White', hex: '#FFFFFF' },
  { id: 'kraft', name: 'Kraft', hex: '#C9A883' },
  { id: 'navy', name: 'Navy', hex: '#1E2B45' },
];
