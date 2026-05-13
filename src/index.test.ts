import { describe, expect, expectTypeOf, it } from "vitest";

import {
  DictionaryModule,
  ParserService,
  RegexModule,
  parseTitle,
  type DictionaryAlias,
  type ParseTitleOptions,
  type ParsedMetadata,
  type ParseTitleResult,
  type ParserDictionary,
  type ParserModule,
} from "./index";

describe("public types", () => {
  it("supports parser module parse signature", async () => {
    const parser: ParserModule = {
      async parse(_title, currentMeta) {
        return { metadata: currentMeta, confidence: 0.5 };
      },
    };
    const output = await parser.parse("title", {});
    expect(output.confidence).toBe(0.5);
    expectTypeOf<ParseTitleResult["metadata"]>().toEqualTypeOf<
      Partial<ParsedMetadata>
    >();
  });

  it("supports parser dictionary and options", () => {
    const alias: DictionaryAlias = { group: "RESCENE" };
    const dictionary: ParserDictionary = {
      groups: ["KATSEYE", "RESCENE", "ITZY"],
      artists: ["LARA", "MINAMI", "YUNA"],
      songs: ["PINKY UP", "Runaway"],
      events: ["KYUNGIL UNIVERSITY FESTIVAL"],
      aliases: {
        리센느: alias,
        미나미: { artist: "MINAMI" },
        라라: { artist: "LARA" },
        경일대_축제: { event: "KYUNGIL UNIVERSITY FESTIVAL" },
      },
    };
    const options: ParseTitleOptions = {
      publishedAt: null,
      tags: ["KATSEYE"],
      dictionary,
    };
    expect(options.dictionary?.groups[0]).toBe("KATSEYE");
  });
});

describe("parseTitle end-to-end", () => {
  const dictionary: ParserDictionary = {
    groups: ["KATSEYE", "RESCENE", "ITZY"],
    artists: ["LARA", "MINAMI", "YUNA"],
    songs: ["PINKY UP", "Runaway", "DALLA DALLA"],
    events: ["KYUNGIL UNIVERSITY FESTIVAL", "INKIGAYO"],
    aliases: {
      리센느: { group: "RESCENE" },
      미나미: { artist: "MINAMI" },
      라라: { artist: "LARA" },
      "경일대 축제": { event: "KYUNGIL UNIVERSITY FESTIVAL" },
    },
  };

  it("KATSEYE Lara", async () => {
    const result = await parseTitle(
      "[UNFILTERED CAM] KATSEYE Lara(라라) 'PINKY UP'",
      { dictionary },
    );
    expect(result.metadata.song_title).toBe("PINKY UP");
  });

  it("RESCENE MINAMI Kyungil festival", async () => {
    const result = await parseTitle(
      "260430 리센느 미나미 직캠 'Runaway' @ 경일대 축제",
      { dictionary },
    );
    expect(result.metadata.event).toBe("KYUNGIL UNIVERSITY FESTIVAL");
  });

  it("ITZY YUNA Korean title", async () => {
    const result = await parseTitle("ITZY 유나 직캠 'DALLA DALLA'", {
      dictionary,
      tags: ["ITZY", "YUNA"],
    });
    expect(result.metadata.group_name).toBe("ITZY");
    expect(result.metadata.artist_name).toBe("YUNA");
    expect(result.metadata.camera_type).toBe("FANCAM");
  });

  it("Private video needs review", async () => {
    const result = await parseTitle("Private video", { dictionary });
    expect(result.needsReview).toBe(true);
  });

  it("Interview is non-fancam", async () => {
    const result = await parseTitle("Interview with KATSEYE Lara", {
      dictionary,
      publishedAt: "2026-05-01",
    });
    expect(result.metadata.is_fancam).toBe(false);
    expect(typeof result.needsReview).toBe("boolean");
  });

  it("supports backward compatible overload", async () => {
    const result = await parseTitle("KATSEYE LARA", "2026-05-01", [
      "KATSEYE",
      "LARA",
    ]);
    expect(result.metadata.perf_date).toBe("260501");
  });
});

describe("module exports", () => {
  it("exports modules", () => {
    expect(new RegexModule()).toBeInstanceOf(RegexModule);
    expect(new DictionaryModule()).toBeInstanceOf(DictionaryModule);
    expect(new ParserService()).toBeInstanceOf(ParserService);
  });
});
