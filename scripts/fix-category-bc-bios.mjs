// ISSUE-008 Category B/C fix: replace event-roster/description text in `bio`
// with real personal bio text recovered from events-data.json / artists-data.json,
// or clear (unset) where no real bio text could be found.
// Run: SANITY_WRITE_TOKEN=... node scripts/fix-category-bc-bios.mjs
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 't5nsm79o',
  dataset: 'production',
  apiVersion: '2026-03-20',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

// slug -> _id, and target bio (null => unset/clear; string => set to that text)
const fixes = [
  // --- Category B: real bio text recovered ---
  {
    slug: 'hoang-vu',
    id: '19d7fceb-3091-477d-8dc6-56a94c802db6',
    bio: `Hoàng Vũ aka somethingmaker. Vũ is a spontaniously artist, practicing through painting, poetry, visual, video-game, carpentry, music. It came from not having a physical space to do painting, while the desire to create a more immense, comprehensive and abstract space increased. At the end of 2022, Vu threw himself into the sonic-field. Played at Gãy no.17, released his first EP "Mangrove" at NightSwim (The Observatory Saigon), also Saigon Community Radio, Cù Rú Bar, IntoArt Forest. His sound focuses on the atmospheric, the ecosystem between the speakers, insect-characteristics, air and water, organic and non-organic. He's not only looking for what he mean to play, but also about during the tracks, it's progressing itself and surprise him too, like putting fishes in a tank and looking it swimming. The musical is blended into the background, be the base and make room for field recordings, for blender experiments, for happy-accidents of generator, for granular disintegration and fluctuation of digital algorithms evolving.`,
  },
  {
    slug: 'dan-nguyen',
    id: '89c1428d-b8f0-4b3d-af80-22f43a336c3f',
    bio: `a music producer, DJ, and visual artist dedicated to unearthing and archiving the sights and sounds of Vietnamese New Wave from Little Saigon, California in the 1980s–90s. his +1 contemporary project California Dreaming was presented at MoT+++ and he participated as a guest artist during A. Farm season 4.`,
  },
  {
    slug: 'duy-nguyen',
    id: 'artist-duy-nguyen',
    bio: `Duy Nguyen (b.1989 in Kuala Lumpur, Malaysia) grew up in the Bidong refugee camp and migrated to Norway as a child. His youth was spent on the west coast of Norway. He has a background as a designer and has developed an image-based art practice over the last few years. His research includes themes of migration, diaspora stories, and multicultural identity – often in connection with mental health. In a short time, he has made an impression nationally and internationally; with participation at high-profile group shows such as Høstutstillingen (National Art Exhibition), Østlandsutstillingen, Liquida Photo Festival, Fresh Eyes, and more. He was recently chosen to participate in Vårutstillingen 2024 (The Spring Exhibition) at Fotogalleriet. Nguyen has completed a few artist residencies including Leipzig International Arts Program (LIA), Paratissima Factory, and is now participating in the Office of Contemporary Art Norway's 1-year residency program at Künstlerhaus Bethanien in Berlin, where he will have an exhibition later this year. His work is in the collection of Karmøy Kunstforening, PRS Collection Turin, and Goethe-Institut. In 2024 he had his first major solo exhibition, the same year he was also awarded a 2-year working grant from Norwegian Government Grants for Artists to further develop his art practice. Learn more about his works: vitaboy.net`,
  },
  {
    slug: 'vuong-thien',
    id: '438b122e-16cc-4554-af4f-887d20e5ecb7',
    bio: `The dynamic duo Pilgrim Raid consisting of Vuong Thien and Long Tran recently released their first album Vincent, exploring a mix of ambient & noise combining sampling with synthesis in a deep meditation on the new. They are currently working on their second album and also exploring a variety of different genres from downtempo hip-hop to euro-trash-pop to bass.`,
  },
  {
    slug: 'bill-nguyen',
    id: '9b87622b-7f19-410d-974d-52b30c8d013c',
    bio: `a Ho Chi Minh City-based artist and curator whose practice spans performance, curation, and conceptual art. he performed in performance plus 2018 and 2019 at MoT+++, including the durational piece Bless You Hold Me (with Cam Xanh) and curated the Happy Birthday Bill programme. Bill Nguyen tattooed a poem by Cam Xanh onto his right thigh during the opening performance of Happy Birthday Bill.`,
  },
  {
    slug: 'nguyen-hoa',
    id: 'artist-nguyen-hoa',
    bio: `Nguyễn Hoá works primarily with sculpture, woodcarving and lacquer and painting. Having close ties with his hometown, Hue, he always yearns to converse with the gone past of the Nguyen dynasty and its legacy, which is manifested through temples, mausoleums, traditions and rituals. His works weave together the techniques of woodworking, and traditional lacquer, as well as distilled forms of painting in order to grasp the nuances of place, history, culture and nature. After graduating from the Hue University of Fine Arts in 2005 majoring in Sculpture, Nguyễn Hoá worked as a restorer for local organisations. He also took up a teaching post at his alma mater. Since then, he has participated in various exhibitions, both local and international. Some of them includes 'To each of their own sky' curated by Do Tuong Linh at Mơ Art Space, Ha Noi (2023), Contemporary Art Week 'Nổ cái bùm' in Hue (2020), group exhibitions in Yogyakarta, Indonesia, and Chiang Mai, Thailand (2018), the notable Gallery 9's 25th-anniversary jubilee exhibition in Amsterdam (2014), 'The Lost Images' at Ganesha Gallery, the Netherlands (2010). Apart from his artistic practice, Nguyễn Hoá has actively participated in many community-development activities in Hue. In 2011, he co-founded Then cafe with artist Tran Tuan, and in 2020, he launched Tum, which tripled as his studio, home and a gathering space where artists can organise discussions and residencies. During his time at A. Farm, Nguyễn Hoá will continue to explore his interest in the history and legacy of the Nguyen dynasty, this time, through the application of Hue's golden apricot flowers found in royal palaces and tombs in quotidian objects that he chances upon in Saigon.`,
  },
  {
    slug: 'nguyen-hong-giang',
    id: '6143fbfe-5a8f-405a-876a-4558d1e0d449',
    bio: `Writher (Nguyen Hong Giang) is a Vietnamese producer, composer, and label head, currently based in Saigon. With 11 years of training at the Ho Chi Minh Conservatory behind him, he now works primarily with experimental noise music. Writher embodies an adventurous approach to making music, exploring sound generation through a variety of approaches and techniques. His arsenal includes computer, software, synthesis, tape manipulation, recordings, acoustic instruments, and analog effects. Writher employs his custom software, termed "The Architect," for control, manipulation, and arrangement. Giang Records, a label that Writher founded in 2011, has shared his extensive output. Operating at the nexus of rock, soundtrack music, hip hop, and electronic music, Giang Records' catalogue distills Writher's affinities for video games, distortion, dark ambient, and black metal into a dynamic discography. Learn more about Writher at https://linktr.ee/outnhg & https://nguyenhonggiang.bandcamp.com/`,
  },
  {
    slug: 'mathieu-dufourg',
    id: 'artist-mathieu-dufourg',
    bio: `mathieu dufourg is a french actor, poet, and director based in ho chi minh city. he co-founded the theatre company nés sous x and works across performance, poetry, and cross-cultural production. he authored a critical volume on the work of artist bao vuong, published by skira paris. participated in MoT+++'s performance plus 2019 program.`,
  },
  {
    slug: 'tobias-ahlbrecht',
    id: 'artist-tobias-ahlbrecht',
    bio: `tobias ahlbrecht is a german documentary and fine art photographer. his long-term project DECAY investigates abandoned sites across the former east germany, examining memory and the material traces of the GDR. BA from arts university bournemouth. he exhibited in vietnam in 2019 and participated in MoT+++'s performance plus program.`,
  },
  {
    slug: 'nguyen-chung',
    id: '13f9b446-1d1b-4646-bb2a-a1f70ff0f82a',
    bio: `nguyễn chung is a dance artist, somatic movement facilitator, and biodynamic craniosacral therapist based in melbourne/naarm. a graduate of the vietnam dance academy in hanoi, they worked from 2009–2016 as a full-time dancer with arabesque dance company (vietnam), t.h.e dance company (singapore), and cinevox junior company (switzerland), winning a special prize at the korea international modern dance competition (2013). their practice integrates somatic and contemplative approaches to healing and performance — spanning dance, movement, therapeutic touch, sleep, and dream. they hold a diploma in biodynamic craniosacral therapy and are pursuing additional study in somatic movement education. performances have been presented across asia, europe, the americas, and australia, including at MoT+++ (performance plus 2019), para||el performance space in brooklyn, and american dance festival.`,
  },

  // --- Category B: no real bio text found, clear ---
  { slug: 'lu-nguyen', id: '11ab57dc-4419-4fbe-81a7-f2fb937fba54', bio: null },
  { slug: 'carl-stone', id: '4b467539-707d-474f-837c-d0edd4b3aec3', bio: null },
  { slug: 'tran-van-thao', id: '65ca2a9a-bde3-4ee5-b6ea-7bf253f6cf62', bio: null },
  { slug: 'ngo-dinh-bao-chau', id: '22cd71f8-6223-4bc7-924d-3a7dab6af1ec', bio: null },
  { slug: 'chicko', id: '1c650e5e-00f9-4b12-93f2-d7c33780b253', bio: null },
  { slug: 'nguyen-van-du', id: '37fa40cf-5ac5-4196-9d27-d6431472de42', bio: null },
  { slug: 'annie-thao-phan', id: '86a4e929-cff2-444c-bf18-d3e819e760b7', bio: null },
  { slug: 'ken-ueno', id: 'f5a61907-d48f-4dc7-8240-0f086d5c2b11', bio: null },
  { slug: 'ho-tuong-danh', id: '0ea62f48-bae2-49a8-9b9f-90bafee276f8', bio: null },
  { slug: 'ayano-otani', id: 'd4cd65a5-421e-4d49-9c2e-584252e1b15d', bio: null },
  { slug: 'duy-bao', id: '3fa3bc10-2926-46cd-a8ef-982e12380fe7', bio: null },

  // --- Category C: no real bio text found, clear ---
  { slug: 'fad-plastic', id: 'e04f2509-9de5-457b-9ae7-6cb9a1634999', bio: null },
  { slug: 'lys-bui', id: '59845f3f-988e-48ad-b268-aea94a6934f4', bio: null },
];

for (const f of fixes) {
  let tx = client.patch(f.id);
  if (f.bio === null) {
    tx = tx.unset(['bio']);
  } else {
    tx = tx.set({ bio: f.bio });
  }
  const res = await tx.commit();
  console.log(`patched [${f.slug}] _id=${f.id} -> bio=${f.bio === null ? 'NULL (unset)' : `SET (len=${f.bio.length})`}`);
}

console.log('\nDone.');
