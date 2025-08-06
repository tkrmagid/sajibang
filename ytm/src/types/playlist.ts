import { SearchResult } from "./search";

export interface PlaylistInfo {
  id: string;
  title: string;
  total: number;
  videos: SearchResult[];
}