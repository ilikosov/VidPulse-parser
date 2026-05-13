import type { ParsedMetadata, ParserModule } from "./parser.types";

const CAMERA_PATTERNS: Array<{
  pattern: RegExp;
  value: string;
  fancamBias?: number;
}> = [
  {
    pattern: /\bCLOSE[- ]?UP\s+FANCAM\b/i,
    value: "CLOSE-UP FANCAM",
    fancamBias: 0.98,
  },
  {
    pattern: /\bUNFILTERED\s+CAM\b/i,
    value: "UNFILTERED CAM",
    fancamBias: 0.85,
  },
  { pattern: /\bFULL\s+CAM\b/i, value: "FULL CAM", fancamBias: 0.75 },
  { pattern: /\bFACE\s*CAM\b/i, value: "FACECAM", fancamBias: 0.95 },
  {
    pattern: /\bFAN\s*CAM\b|\bFANCAM\b|직캠/i,
    value: "FANCAM",
    fancamBias: 0.95,
  },
  { pattern: /\bCHOREOGRAPHY\b/i, value: "CHOREOGRAPHY" },
  { pattern: /\bVERTICAL\b/i, value: "VERTICAL" },
  { pattern: /\bHORIZONTAL\b/i, value: "HORIZONTAL" },
  { pattern: /\b8K\b/i, value: "8K" },
  { pattern: /\b4K\b/i, value: "4K" },
];

const NEGATIVE_PATTERNS = [
  /\bprivate video\b/i,
  /\binterview\b/i,
  /\bhighlight\b/i,
  /\bmv\b/i,
  /\bshorts?\b/i,
  /\bbehind\b/i,
];

const SONG_PATTERNS = [
  /'([^']+)'/,
  /"([^"]+)"/,
  /‘([^’]+)’/,
  /“([^”]+)”/,
  /「([^」]+)」/,
  /＜([^＞]+)＞/,
];

export class RegexModule implements ParserModule {
  async parse(title: string, currentMeta: Partial<ParsedMetadata>) {
    const metadata: Partial<ParsedMetadata> = { ...currentMeta };
    const normalized = title.trim();

    const dateMatch = normalized.match(/\b(\d{6})\b/);
    if (dateMatch) metadata.perf_date = dateMatch[1];

    for (const pattern of SONG_PATTERNS) {
      const songMatch = normalized.match(pattern);
      if (songMatch?.[1]) {
        metadata.song_title = songMatch[1].trim();
        break;
      }
    }

    let fancamConfidence = 0;
    for (const cam of CAMERA_PATTERNS) {
      if (cam.pattern.test(normalized)) {
        metadata.camera_type = cam.value;
        fancamConfidence = Math.max(
          fancamConfidence,
          cam.fancamBias ?? fancamConfidence,
        );
        break;
      }
    }

    const negative = NEGATIVE_PATTERNS.some((p) => p.test(normalized));
    metadata.is_fancam = !negative && fancamConfidence >= 0.7;
    metadata.fancam_confidence = negative ? 0 : fancamConfidence;

    const event = this.extractEvent(normalized);
    if (event) metadata.event = event;

    const confidence = this.computeConfidence(metadata, negative);
    metadata.confidence = confidence;

    return { metadata, confidence };
  }

  private extractEvent(title: string): string | undefined {
    const atEvent = title.match(/@\s*([^#|]+?)(?=\s#|\s\d{6}\b|$)/);
    if (atEvent?.[1]) return atEvent[1].trim();

    const pipeEvent = title.match(/\|\s*([^|]+)$/);
    if (pipeEvent?.[1]) return pipeEvent[1].trim();

    return undefined;
  }

  private computeConfidence(
    metadata: Partial<ParsedMetadata>,
    negative: boolean,
  ): number {
    if (negative) return 0.05;
    let score = 0.2;
    if (metadata.perf_date) score += 0.2;
    if (metadata.song_title) score += 0.2;
    if (metadata.camera_type) score += 0.2;
    if (metadata.event) score += 0.2;
    return Math.min(1, score);
  }
}
