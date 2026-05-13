export interface ParsedMetadata {
  perf_date?: string;
  group_name?: string;
  artist_name?: string;
  song_title?: string;
  event?: string;
  camera_type?: string;
  is_fancam?: boolean;
  fancam_confidence?: number;
  confidence?: number;
}

export interface ParseTitleResult {
  metadata: Partial<ParsedMetadata>;
  needsReview: boolean;
}

export interface ParserModule {
  parse(
    title: string,
    currentMeta: Partial<ParsedMetadata>,
  ): Promise<{ metadata: Partial<ParsedMetadata>; confidence: number }>;
}

export interface ParseTitleOptions {
  publishedAt?: string | null;
  tags?: string[];
  dictionary?: import("./dictionary.types").ParserDictionary;
}
