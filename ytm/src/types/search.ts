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

export type ItemType = "노래"|"동영상"|"앨범"|"커뮤니티 재생목록"|"아티스트"|"에피소드"|"프로필";
