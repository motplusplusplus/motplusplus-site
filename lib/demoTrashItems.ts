const D = 'https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/museum/demo';

export type TrashItem = {
  _id: string;
  artist: string;
  title: string;
  medium: string;
  year: number;
  dimensions: string;
  edition: string;
  description: string;
  images: string[];
  museumLocationId?: string;   // links to a museum location _id
  neighbourhood?: string;      // neighbourhood of museum placement
  sold?: boolean;
  price?: string;              // internal — not rendered unless unlocked
};

export const DEMO_TRASH_ITEMS: TrashItem[] = [
  {
    _id: 'trash-demo-8',
    artist: 'Thomas S. Monson',
    title: 'All is as one day with God',
    medium: 'sound installation, 4-channel audio, speakers, timer unit',
    year: 2008,
    dimensions: 'dimensions variable',
    edition: 'unique',
    description: 'A four-channel sound installation occupying a residential interior in District 1. The work draws from field recordings made across Ho Chi Minh City at dawn - the city as liturgy, as repetition, as evidence of something continuing. Duration: 74 minutes, looped.',
    images: [`${D}/102_0295_1_.jpg`],
    museumLocationId: 'demo-8',
    neighbourhood: 'District 1',
    price: '4500 USD',
  },
  {
    _id: 'trash-demo-20',
    artist: 'Lorenzo Snow',
    title: 'Alpha and Omega, the beginning and the end',
    medium: 'watercolour on paper',
    year: 2019,
    dimensions: '42 × 59 cm',
    edition: '1/1',
    description: 'A single sheet of heavyweight cotton paper, worked in successive transparent washes over several weeks. The image emerges and recedes depending on the quality of light in the room. Currently placed in a private residence in District 1.',
    images: [`${D}/th_12_.jpg`],
    museumLocationId: 'demo-20',
    neighbourhood: 'District 1',
    price: '2200 USD',
  },
  {
    _id: 'trash-demo-21',
    artist: 'Wilford Woodruff',
    title: 'Deny yourselves of all ungodliness',
    medium: 'neon, powder-coated steel armature',
    year: 1990,
    dimensions: '180 × 90 cm',
    edition: '1/3 + 1 AP',
    description: 'Bent neon tubing spelling a phrase pulled from a 19th-century American sermon, mounted on powder-coated steel. The work has a broken element - one letter dims intermittently - which the artist considers part of the piece. Placed in a café in District 1.',
    images: [`${D}/p6030002.jpg`],
    museumLocationId: 'demo-21',
    neighbourhood: 'District 1',
    sold: true,
  },
  {
    _id: 'trash-demo-3',
    artist: 'Lucy Mack Smith',
    title: 'Endless duration',
    medium: 'found objects, vitrine, archive materials, hand-typed index cards',
    year: 2003,
    dimensions: '45 × 30 × 30 cm (vitrine)',
    edition: 'unique',
    description: 'A sealed vitrine containing a collection of objects sourced over two years from street markets across Saigon: broken watches, a child\'s report card, a hotel key, a length of string tied in an unidentifiable knot. The index cards list each object\'s provenance in the artist\'s hand. Currently placed in a private home in District 2.',
    images: [`${D}/dscn3017-thumb-250x187-5044.jpg`],
    museumLocationId: 'demo-3',
    neighbourhood: 'District 2',
    price: '1800 USD',
  },
  {
    _id: 'trash-demo-15',
    artist: 'Heber J. Grant',
    title: 'Come unto Christ',
    medium: 'hand-woven textile, natural dyes (indigo, iron, tannin)',
    year: 2023,
    dimensions: '210 × 140 cm',
    edition: 'unique',
    description: 'A large floor-to-ceiling textile woven on a traditional frame loom. The indigo blue ground shifts from dense to near-white across its width. Natural dyes were extracted during a two-month residency in the Mekong Delta. The title is borrowed and placed sideways to its source. Currently hung in a private studio in District 4.',
    images: [`${D}/visok11g.jpg`],
    museumLocationId: 'demo-15',
    neighbourhood: 'District 4',
    price: '6000 USD',
  },
  {
    _id: 'trash-demo-10',
    artist: 'David Whitmer',
    title: 'Choice land',
    medium: 'found objects, vitrine, archive materials',
    year: 2008,
    dimensions: '60 × 40 × 40 cm (vitrine)',
    edition: 'unique',
    description: 'A second vitrine work: this one arranged around the idea of belonging. Objects collected during a period of displacement include a broken compass, a bundle of letters never sent, and a single key cut for a lock that no longer exists. The objects are arranged without labels. Placed in a private home in District 3.',
    images: [`${D}/pict0126.jpg`],
    museumLocationId: 'demo-10',
    neighbourhood: 'District 3',
    sold: true,
  },
  {
    _id: 'trash-demo-28',
    artist: 'Heber C. Kimball',
    title: 'Angel of the Lord',
    medium: 'ink on silk',
    year: 2020,
    dimensions: '34 × 48 cm (unframed)',
    edition: '1/1',
    description: 'Worked in sumi ink on raw silk, the image depicts a figure mid-movement - neither arriving nor departing. The silk is translucent; the work is mounted with light behind it. Placed in a first-floor window in District 1 where it is visible from the street at night.',
    images: [`${D}/tio-1.jpg`],
    museumLocationId: 'demo-28',
    neighbourhood: 'District 1',
    price: '3400 USD',
  },
  {
    _id: 'trash-demo-30',
    artist: 'Joseph F. Smith',
    title: 'Enter into his rest',
    medium: 'video, single channel, looped, no sound',
    year: 2003,
    dimensions: 'duration 12\'08", monitor and media player',
    edition: '3/5',
    description: 'A twelve-minute single-channel video in which a door opens and closes at irregular intervals. No one passes through. The work was made by leaving a camera running in an unoccupied room over the course of a day. The door moves due to air pressure changes. Currently placed in a studio in District 5.',
    images: [`${D}/dscn2841_3_.jpg`],
    museumLocationId: 'demo-30',
    neighbourhood: 'District 5',
    price: '750 USD',
  },
  {
    _id: 'trash-demo-13',
    artist: 'Newel K. Whitney',
    title: 'Keep a record',
    medium: 'copper wire and thread, hand-sewn',
    year: 2021,
    dimensions: '28 × 38 cm (framed)',
    edition: 'unique',
    description: 'Fine copper wire stitched into cotton thread in a pattern that resembles script but resolves into abstraction on close inspection. The title refers to an instruction, not a description. Placed in a private apartment in Bình Thạnh.',
    images: [`${D}/th_33_.jpg`],
    museumLocationId: 'demo-13',
    neighbourhood: 'Bình Thạnh',
    price: '900 USD',
  },
  {
    _id: 'trash-demo-17',
    artist: 'Spencer W. Kimball',
    title: 'Promised land',
    medium: 'oil on linen',
    year: 2011,
    dimensions: '80 × 100 cm',
    edition: '1/1',
    description: 'A landscape that resists identification: the horizon line sits too high, the vegetation is neither tropical nor temperate. The paint is applied in thin, dry layers, building a surface that is simultaneously bare and dense. Placed in a private home in Gò Vấp.',
    images: [`${D}/th_40_.jpg`],
    museumLocationId: 'demo-17',
    neighbourhood: 'Gò Vấp',
    sold: true,
  },
];

// Quick lookup: museum location id → trash item id
export const MUSEUM_TO_TRASH: Record<string, string> = Object.fromEntries(
  DEMO_TRASH_ITEMS
    .filter(i => i.museumLocationId)
    .map(i => [i.museumLocationId!, i._id])
);
