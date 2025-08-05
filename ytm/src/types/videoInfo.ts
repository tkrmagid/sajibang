export interface VideoInfo {
  videoId: string;
  title: string;
  channel: {
    id: string;
    name: string;
  }
  thumbnail: string;
  duration: number;
  regions: string[];
}