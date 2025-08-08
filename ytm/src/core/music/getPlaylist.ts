import axios from "axios";
import { PlaylistInfo } from "../../types/playlist";
import { getCookie } from "../../utils/getCookie";
import { defaultHeader } from "../../utils/getHeader";
import { decodeHex } from "../../utils/decoder";
import { SearchResult } from "../../types/search";

export async function getPlaylist(playlistId: string): Promise<PlaylistInfo> {
  const url = `https://music.youtube.com/playlist?list=${playlistId}`;
  const res: {
    status: number;
    data?: any;
    err?: any;
  } = await axios.get(url, {
    headers: {
      ...defaultHeader,
      "Cookie": getCookie(),
    }
  }).then(v => ({
    status: v.status,
    data: v.data
  })).catch((err) => ({
    status: -1,
    err: err?.response?.message
  }));
  if (!res.data || res.err) throw new Error(res.err || "오류발생");
  const ytInitMatchs = [...res.data.matchAll(/initialData\.push\((.*?)\);/gs)];
  if (!ytInitMatchs) throw new Error("노래목록 데이터 추출 실패");
  const ytInitMatch = ytInitMatchs.find(v => v[1].includes("/browse"));
  if (!ytInitMatch) throw new Error("노래목록 데이터 추출 실패2");
  const ytInitText = decodeHex(ytInitMatch[1])?.split("data: '")?.[1]?.slice(0,-2);
  if (!ytInitText) throw new Error("노래목록 데이터 추출 실패3");
  const ytData = JSON.parse(ytInitText);

  const playlistTitle = ytData.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.musicResponsiveHeaderRenderer?.title?.runs?.[0]?.text;
  const contents = ytData.contents?.twoColumnBrowseResultsRenderer?.secondaryContents?.sectionListRenderer?.contents?.[0]?.musicPlaylistShelfRenderer?.contents;

  if (!playlistTitle || !contents) throw new Error("플레이리스트 가져오기 오류");

  const videos: SearchResult[] = [];

  for (const item of contents) {
    const video = item.musicResponsiveListItemRenderer;
    if (!video) continue;
    const videoId = video.playlistItemData?.videoId;
    const title = video.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
    const channelId = video.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
    const channelName = video.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
    const duration = video.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]?.text;
    if (!videoId || !title || !channelId || !channelName || !duration) continue;
    videos.push({
      videoId,
      title,
      channel: {
        id: channelId,
        name: channelName,
      },
      thumbnail: video.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.pop()?.url || "",
      duration,
    });
  }
  
  return {
    id: playlistId,
    title: playlistTitle,
    total: videos.length,
    videos: videos,
  };
}