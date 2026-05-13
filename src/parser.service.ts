import { DictionaryModule } from "./dictionary.module";
import type { ParserDictionary } from "./dictionary.types";
import type {
  ParseTitleOptions,
  ParseTitleResult,
  ParsedMetadata,
  ParserModule,
} from "./parser.types";
import { RegexModule } from "./regex.module";

export interface ParserServiceOptions {
  modules?: ParserModule[];
  dictionary?: ParserDictionary;
}

export class ParserService {
  private readonly modules: ParserModule[];
  private readonly dictionary?: ParserDictionary;

  constructor(options: ParserServiceOptions = {}) {
    this.dictionary = options.dictionary;
    this.modules = options.modules ?? [
      new RegexModule(),
      new DictionaryModule(this.dictionary),
    ];
  }

  async parseTitle(
    title: string,
    options: ParseTitleOptions = {},
  ): Promise<ParseTitleResult> {
    let metadata: Partial<ParsedMetadata> = {};

    for (const module of this.modules) {
      const result = await module.parse(title, metadata);
      metadata = { ...metadata, ...result.metadata };
    }

    metadata = this.applyTagsFallback(
      metadata,
      options.tags,
      options.dictionary ?? this.dictionary,
    );

    const confidence = this.calculateMetadataConfidence(metadata);
    metadata.confidence = confidence;
    metadata = this.validateFields(metadata, options);

    const needsReview = this.determineNeedsReview(
      title,
      metadata,
      options,
      options.dictionary ?? this.dictionary,
    );
    return { metadata, needsReview };
  }

  private validateFields(
    metadata: Partial<ParsedMetadata>,
    options: ParseTitleOptions,
  ): Partial<ParsedMetadata> {
    return {
      ...metadata,
      group_name: this.validateField(metadata.group_name),
      artist_name: this.validateField(metadata.artist_name),
      song_title: this.validateField(metadata.song_title),
      event: this.validateField(metadata.event),
      perf_date:
        metadata.perf_date ??
        (options.publishedAt
          ? options.publishedAt.slice(2, 10).replace(/-/g, "")
          : undefined),
    };
  }

  private validateField(value?: string): string | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private calculateMetadataConfidence(
    metadata: Partial<ParsedMetadata>,
  ): number {
    let score = 0;
    if (metadata.group_name || metadata.artist_name) score += 0.2;
    if (metadata.song_title) score += 0.2;
    if (metadata.perf_date) score += 0.15;
    if (metadata.event) score += 0.15;
    if (metadata.camera_type) score += 0.1;
    if (metadata.is_fancam !== undefined) score += 0.1;
    if (metadata.fancam_confidence !== undefined)
      score += Math.min(0.1, metadata.fancam_confidence * 0.1);
    return Math.min(1, score);
  }

  private determineNeedsReview(
    title: string,
    metadata: Partial<ParsedMetadata>,
    options: ParseTitleOptions,
    dictionary?: ParserDictionary,
  ): boolean {
    if (/\bprivate video\b/i.test(title)) return true;

    const hasPublishedDate = Boolean(options.publishedAt);
    if (!metadata.perf_date && !hasPublishedDate) return true;

    if (metadata.is_fancam) {
      const hasPerformer = Boolean(metadata.group_name || metadata.artist_name);
      const hasSongOrEvent = Boolean(metadata.song_title || metadata.event);
      if (!hasPerformer || !hasSongOrEvent) return true;
    } else if (
      !metadata.song_title &&
      !metadata.event &&
      !metadata.group_name &&
      !metadata.artist_name
    ) {
      return true;
    }

    if (dictionary && this.hasNonEnglishWithAliases(metadata, dictionary))
      return true;

    return (metadata.confidence ?? 0) < 0.25;
  }

  private hasNonEnglishWithAliases(
    metadata: Partial<ParsedMetadata>,
    dictionary: ParserDictionary,
  ): boolean {
    const source = [
      metadata.group_name,
      metadata.artist_name,
      metadata.song_title,
      metadata.event,
      metadata.camera_type,
    ]
      .filter(Boolean)
      .join(" ");
    const hasAliases = Object.keys(dictionary.aliases).length > 0;
    return (
      hasAliases && /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(source)
    );
  }

  private applyTagsFallback(
    metadata: Partial<ParsedMetadata>,
    tags?: string[],
    dictionary?: ParserDictionary,
  ): Partial<ParsedMetadata> {
    if (!tags?.length || !dictionary) return metadata;
    const joined = tags.join(" ");
    return {
      ...metadata,
      group_name:
        metadata.group_name ?? this.findFirst(joined, dictionary.groups),
      artist_name:
        metadata.artist_name ?? this.findFirst(joined, dictionary.artists),
      song_title:
        metadata.song_title ?? this.findFirst(joined, dictionary.songs),
      event: metadata.event ?? this.findFirst(joined, dictionary.events),
    };
  }

  private applyDictionaryTitleFallback(
    metadata: Partial<ParsedMetadata>,
    title: string,
    dictionary?: ParserDictionary,
  ): Partial<ParsedMetadata> {
    if (!dictionary) return metadata;
    const lower = title.toLowerCase();
    const resolve = (
      canonical: string[],
      aliases: Record<string, string | undefined>,
    ): string | undefined => {
      for (const v of canonical) {
        if (lower.includes(v.toLowerCase())) return v;
      }
      for (const [alias, mapped] of Object.entries(aliases)) {
        if (mapped && lower.includes(alias.toLowerCase())) return mapped;
      }
      return undefined;
    };

    return {
      ...metadata,
      group_name:
        metadata.group_name ??
        resolve(
          dictionary.groups,
          Object.fromEntries(
            Object.entries(dictionary.aliases).map(([k, v]) => [k, v.group]),
          ),
        ),
      artist_name:
        metadata.artist_name ??
        resolve(
          dictionary.artists,
          Object.fromEntries(
            Object.entries(dictionary.aliases).map(([k, v]) => [k, v.artist]),
          ),
        ),
      song_title:
        metadata.song_title ??
        resolve(
          dictionary.songs,
          Object.fromEntries(
            Object.entries(dictionary.aliases).map(([k, v]) => [k, v.song]),
          ),
        ),
      event:
        metadata.event ??
        resolve(
          dictionary.events,
          Object.fromEntries(
            Object.entries(dictionary.aliases).map(([k, v]) => [k, v.event]),
          ),
        ),
    };
  }

  private findFirst(haystack: string, values: string[]): string | undefined {
    const lower = haystack.toLowerCase();
    return values.find((v) => lower.includes(v.toLowerCase()));
  }
}

export async function parseTitle(
  title: string,
  options?: ParseTitleOptions,
): Promise<ParseTitleResult>;
export async function parseTitle(
  title: string,
  publishedAt?: string,
  tags?: string[],
): Promise<ParseTitleResult>;
export async function parseTitle(
  title: string,
  optionsOrPublishedAt?: ParseTitleOptions | string,
  tags?: string[],
): Promise<ParseTitleResult> {
  const options: ParseTitleOptions =
    typeof optionsOrPublishedAt === "string"
      ? { publishedAt: optionsOrPublishedAt, tags }
      : (optionsOrPublishedAt ?? {});

  const service = new ParserService({ dictionary: options.dictionary });
  return service.parseTitle(title, options);
}
