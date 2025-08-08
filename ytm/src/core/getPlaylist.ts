import axios from "axios";
import { PlaylistInfo } from "../types/playlist";
import { SearchResult } from "../types/search";
import { getCookie } from "../utils/getCookie";
import { defaultHeader } from "../utils/getHeader";

export async function getPlaylist(playlistId: string): Promise<PlaylistInfo> {
  const url = `https://www.youtube.com/playlist?list=${playlistId}`;
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
  const ytInitMatch = res.data.match(/var ytInitialData = (.*?});/);
  if (!ytInitMatch) throw new Error("플레이리스트 데이터 추출 실패");

  const ytData = JSON.parse(ytInitMatch[1]);
  const playlistTitle = ytData?.metadata?.playlistMetadataRenderer;
  const contents = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;

  if (!playlistTitle || !contents) throw new Error("플레이리스트 가져오기 오류");

  const videos: SearchResult[] = [];

  for (const item of contents) {
    const video = item.playlistVideoRenderer;
    if (!video) continue;
    const videoId = video.videoId;
    const title = video.title.runs?.[0]?.text;
    const channelId = video.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
    const channelName = video.shortBylineText?.runs?.[0]?.text;
    const duration = video.lengthText?.simpleText;
    if (!videoId || !title || !channelId || !channelName || !duration) continue;
    videos.push({
      videoId,
      title,
      channel: {
        id: channelId,
        name: channelName,
      },
      thumbnail: video.thumbnail.thumbnails.pop()?.url || "",
      duration,
    });
  }

  return {
    id: playlistId,
    title: playlistTitle,
    total: videos.length,
    videos,
  };
}