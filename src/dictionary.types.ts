export interface DictionaryAlias {
  group?: string;
  artist?: string;
  song?: string;
  event?: string;
  camera_type?: string;
}

export interface ParserDictionary {
  groups: string[];
  artists: string[];
  songs: string[];
  events: string[];
  aliases: Record<string, DictionaryAlias>;
}
