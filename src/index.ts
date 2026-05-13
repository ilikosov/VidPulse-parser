export interface ParseTitleResult {
  readonly source: string;
  readonly title: string;
  readonly normalizedTitle: string;
}

export function parseTitle(input: string): ParseTitleResult {
  const title = input.trim();

  return {
    source: input,
    title,
    normalizedTitle: title.toLowerCase()
  };
}
