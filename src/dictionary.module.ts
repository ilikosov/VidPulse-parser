import type { ParsedMetadata, ParserModule } from "./parser.types";
import type { DictionaryAlias, ParserDictionary } from "./dictionary.types";

const HARDCODED_EVENT_ALIASES: Record<string, string> = {
  연세대: "YONSEI UNIVERSITY",
  고려대: "KOREA UNIVERSITY",
  경일대: "KYUNGIL UNIVERSITY",
  "경일대 축제": "KYUNGIL UNIVERSITY FESTIVAL",
  뮤직뱅크: "MUSIC BANK",
  음악중심: "MUSIC CORE",
  mcountdown: "M COUNTDOWN",
};

const HARDCODED_CAMERA_ALIASES: Record<string, string> = {
  직캠: "FANCAM",
  페이스캠: "FACECAM",
  세로: "VERTICAL",
  가로: "HORIZONTAL",
  얼빡직캠: "CLOSE-UP FANCAM",
  "unfiltered cam": "UNFILTERED CAM",
};

const QUOTE_VARIANTS = /[“”„‟«»「」『』＂＇‘’‚‛‹›]/g;

export class DictionaryModule implements ParserModule {
  constructor(private readonly dictionary?: ParserDictionary) {}

  async parse(title: string, currentMeta: Partial<ParsedMetadata>) {
    const metadata: Partial<ParsedMetadata> = { ...currentMeta };

    metadata.group_name = this.normalizeField(
      "group",
      metadata.group_name,
      title,
    );
    metadata.artist_name = this.normalizeField(
      "artist",
      metadata.artist_name,
      title,
    );
    metadata.song_title = this.normalizeField(
      "song",
      metadata.song_title,
      title,
    );
    metadata.event = this.normalizeEvent(metadata.event, title);
    metadata.camera_type = this.normalizeCameraType(
      metadata.camera_type,
      title,
    );

    return { metadata, confidence: 0.8 };
  }

  private normalizeField(
    type: keyof DictionaryAlias,
    value: string | undefined,
    title: string,
  ): string | undefined {
    if (!this.dictionary || !value) return value;
    return (
      this.normalizeFromDictionary(type, value) ??
      this.normalizeFromDictionary(type, title) ??
      value
    );
  }

  private normalizeEvent(
    value: string | undefined,
    title: string,
  ): string | undefined {
    const normalized = this.normalizeFromHardcoded(
      HARDCODED_EVENT_ALIASES,
      value ?? title,
    );
    if (normalized) return normalized;
    if (!this.dictionary || !value) return value;
    return (
      this.normalizeFromDictionary("event", value) ??
      this.normalizeFromDictionary("event", title) ??
      value
    );
  }

  private normalizeCameraType(
    value: string | undefined,
    title: string,
  ): string | undefined {
    const normalized = this.normalizeFromHardcoded(
      HARDCODED_CAMERA_ALIASES,
      value ?? title,
    );
    if (normalized) return normalized;
    if (!this.dictionary || !value) return value;
    return (
      this.normalizeFromDictionary("camera_type", value) ??
      this.normalizeFromDictionary("camera_type", title) ??
      value
    );
  }

  private normalizeFromDictionary(
    type: keyof DictionaryAlias,
    source: string,
  ): string | undefined {
    if (!this.dictionary) return undefined;
    const sourceNorm = this.normalizeLookup(source);

    for (const canonical of this.getCanonicalPool(type)) {
      if (this.containsTerm(sourceNorm, this.normalizeLookup(canonical))) {
        return canonical;
      }
    }

    for (const [alias, map] of Object.entries(this.dictionary.aliases)) {
      const mapped = map[type];
      if (!mapped) continue;
      if (this.containsTerm(sourceNorm, this.normalizeLookup(alias))) {
        return mapped;
      }
    }

    return undefined;
  }

  private normalizeFromHardcoded(
    aliasMap: Record<string, string>,
    source: string,
  ): string | undefined {
    const sourceNorm = this.normalizeLookup(source);
    for (const [alias, canonical] of Object.entries(aliasMap).sort(
      (a, b) => b[0].length - a[0].length,
    )) {
      if (this.containsTerm(sourceNorm, this.normalizeLookup(alias))) {
        return canonical;
      }
    }
    return undefined;
  }

  normalizeLookup(value: string): string {
    return value
      .normalize("NFKC")
      .replace(QUOTE_VARIANTS, '"')
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  containsTerm(sourceNormalized: string, termNormalized: string): boolean {
    if (!termNormalized) return false;
    if (
      /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/.test(
        termNormalized,
      )
    ) {
      return sourceNormalized.includes(termNormalized);
    }

    const escaped = termNormalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`);
    return regex.test(sourceNormalized);
  }

  private getCanonicalPool(type: keyof DictionaryAlias): string[] {
    if (!this.dictionary) return [];
    switch (type) {
      case "group":
        return this.dictionary.groups;
      case "artist":
        return this.dictionary.artists;
      case "song":
        return this.dictionary.songs;
      case "event":
        return this.dictionary.events;
      default:
        return [];
    }
  }
}
