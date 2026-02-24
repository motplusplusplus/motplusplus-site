export type Studio = {
  slug: string;
  artistName: string;
  tagline: string;
  neighborhood: string;
  collectiveMember?: boolean;
};

export type Hotel = {
  slug: string;
  name: string;
  tagline: string;
  address: string;
};

export const studios: Studio[] = [
  {
    slug: "andrew-newell-walther",
    artistName: "Andrew Newell Walther",
    tagline: "studio on stilts over the river's edge",
    neighborhood: "thảo điền",
  },
  {
    slug: "le-phi-long",
    artistName: "Le Phi Long",
    tagline: "artist studio",
    neighborhood: "to be confirmed",
    collectiveMember: true,
  },
  {
    slug: "quoc-anh-le",
    artistName: "Quoc Anh Le",
    tagline: "artist studio",
    neighborhood: "to be confirmed",
  },
  {
    slug: "hoang-nam-viet",
    artistName: "Hoang Nam Viet",
    tagline: "artist studio",
    neighborhood: "to be confirmed",
  },
  {
    slug: "karlie-ho",
    artistName: "MoT+++ studio",
    tagline: "hosted by Karlie Ho — posh residential space, art world connections",
    neighborhood: "thảo điền",
  },
  {
    slug: "thom-nguyen",
    artistName: "Thom Nguyen",
    tagline: "artist studio",
    neighborhood: "to be confirmed",
  },
];

export const hotel: Hotel = {
  slug: "amanaki",
  name: "Amanaki Thao Dien Hotel",
  tagline: "hotel track — independence and focus",
  address: "10 Nguyễn Đăng Giai, Thảo Điền, Thủ Đức",
};
