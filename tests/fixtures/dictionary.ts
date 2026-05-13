import type { ParserDictionary } from "../../src";

export const testDictionary: ParserDictionary = {
  groups: ["LE SSERAFIM", "RESCENE", "ITZY", "KISS OF LIFE", "QWER", "KATSEYE"],
  artists: ["YUNJIN", "YUNA", "MINAMI", "NATTY", "LARA", "CHODAN"],
  songs: ["1-800-hot-n-fun", "DALLA DALLA", "Runaway", "PINKY UP"],
  events: [
    "KYUNGIL UNIVERSITY FESTIVAL",
    "YONSEI UNIVERSITY",
    "MUSIC BANK",
    "INKIGAYO",
  ],
  aliases: {
    르세라핌: { group: "LE SSERAFIM" },
    리센느: { group: "RESCENE" },
    있지: { group: "ITZY" },
    키스오브라이프: { group: "KISS OF LIFE" },
    큐더블유이알: { group: "QWER" },

    허윤진: { artist: "YUNJIN" },
    유나: { artist: "YUNA" },
    미나미: { artist: "MINAMI" },
    나띠: { artist: "NATTY" },
    라라: { artist: "LARA" },
    쵸단: { artist: "CHODAN" },

    "1800 hot n fun": { song: "1-800-hot-n-fun" },
    달라달라: { song: "DALLA DALLA" },

    "경일대 축제": { event: "KYUNGIL UNIVERSITY FESTIVAL" },
    연세대: { event: "YONSEI UNIVERSITY" },
    뮤직뱅크: { event: "MUSIC BANK" },
  },
};
