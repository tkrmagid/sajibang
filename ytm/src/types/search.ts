export interface SearchResult {
  videoId: string;
  title: string;
  channel: {
    id: string;
    name: string;
  };
  thumbnail: string;
  duration: string;
}