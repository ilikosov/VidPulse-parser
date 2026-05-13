import { describe, expect, it } from "vitest";

import { parseTitle } from "../src";
import { testDictionary } from "./fixtures/dictionary";

type Case = {
  title: string;
  expected: {
    is_fancam?: boolean;
    event?: string;
    camera_type?: string;
    needsReview?: boolean;
    group_name?: string;
    artist_name?: string;
  };
};

const cases: Case[] = [
  {
    title: "르세라핌 허윤진 직캠 '1-800-hot-n-fun' @Inkigayo 240901",
    expected: { is_fancam: true, camera_type: "FANCAM", event: "Inkigayo" },
  },
  {
    title: "260430 리센느 미나미 직캠 'Runaway' @ 경일대 축제 #kpop",
    expected: {
      is_fancam: true,
      event: "KYUNGIL UNIVERSITY FESTIVAL",
      camera_type: "FANCAM",
      group_name: "RESCENE",
      artist_name: "MINAMI",
    },
  },
  {
    title:
      "[UNFILTERED CAM] KATSEYE Lara(라라) 'PINKY UP' 4K | STUDIO CHOOM ORIGINAL",
    expected: {
      is_fancam: true,
      camera_type: "UNFILTERED CAM",
      artist_name: "LARA",
    },
  },
  {
    title: "있지 유나 직캠 '달라달라' @ 연세대",
    expected: {
      is_fancam: true,
      event: "YONSEI UNIVERSITY",
      group_name: "ITZY",
      artist_name: "YUNA",
    },
  },
  {
    title: "키스오브라이프 나띠 페이스캠 @ 뮤직뱅크",
    expected: {
      is_fancam: true,
      camera_type: "FACECAM",
      event: "MUSIC BANK",
      group_name: "KISS OF LIFE",
      artist_name: "NATTY",
    },
  },
  {
    title: "큐더블유이알 쵸단 세로 직캠",
    expected: {
      is_fancam: true,
      camera_type: "VERTICAL",
      group_name: "QWER",
      artist_name: "CHODAN",
    },
  },
  {
    title: "ITZY YUNA FANCAM @Inkigayo",
    expected: { is_fancam: true, camera_type: "FANCAM", needsReview: false },
  },
  {
    title: "RESCENE MINAMI FanCam @Inkigayo",
    expected: { is_fancam: true, camera_type: "FANCAM", needsReview: false },
  },
  {
    title: "LE SSERAFIM YUNJIN FACECAM",
    expected: { is_fancam: true, camera_type: "FACECAM" },
  },
  {
    title: "KISS OF LIFE NATTY CLOSE-UP FANCAM",
    expected: { is_fancam: true, camera_type: "CLOSE-UP FANCAM" },
  },
  {
    title: "QWER CHODAN FULL CAM",
    expected: { is_fancam: true, camera_type: "FULL CAM" },
  },
  {
    title: "KATSEYE LARA CHOREOGRAPHY",
    expected: { camera_type: "CHOREOGRAPHY" },
  },
  {
    title: "LE SSERAFIM YUNJIN HORIZONTAL CAM",
    expected: { camera_type: "HORIZONTAL" },
  },
  { title: "ITZY YUNA VERTICAL CAM", expected: { camera_type: "VERTICAL" } },
  {
    title: "르세라핌 허윤진 인터뷰",
    expected: { is_fancam: false, needsReview: true },
  },
  { title: "Private video", expected: { is_fancam: false, needsReview: true } },
  {
    title: "RESCENE Highlight Clip",
    expected: { is_fancam: false, needsReview: true },
  },
  {
    title: "KATSEYE MV official",
    expected: { is_fancam: false, needsReview: true },
  },
  {
    title: "QWER behind the scenes",
    expected: { is_fancam: false, needsReview: true },
  },
  {
    title: "ITZY shorts #yuna",
    expected: { is_fancam: false, needsReview: true },
  },
];

describe("parseTitle regression fixtures", () => {
  it.each(cases)("parses: $title", async ({ title, expected }) => {
    const result = await parseTitle(title, { dictionary: testDictionary });

    if (expected.group_name)
      expect(result.metadata.group_name).toBe(expected.group_name);
    if (expected.artist_name)
      expect(result.metadata.artist_name).toBe(expected.artist_name);
    if (expected.event) expect(result.metadata.event).toBe(expected.event);
    if (expected.camera_type)
      expect(result.metadata.camera_type).toBe(expected.camera_type);
    if (expected.is_fancam !== undefined)
      expect(result.metadata.is_fancam).toBe(expected.is_fancam);
    if (expected.needsReview !== undefined)
      expect(result.needsReview).toBe(expected.needsReview);

    if (result.metadata.group_name)
      expect(result.metadata.group_name).toMatch(/^[\x00-\x7F\s-]+$/);
    if (result.metadata.artist_name)
      expect(result.metadata.artist_name).toMatch(/^[\x00-\x7F\s-]+$/);
    if (result.metadata.event)
      expect(result.metadata.event).toMatch(/^[\x00-\x7F\s-]+$/);
    if (result.metadata.camera_type)
      expect(result.metadata.camera_type).toMatch(/^[A-Z0-9\s-]+$/);
  });
});
