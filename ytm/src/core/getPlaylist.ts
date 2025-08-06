import axios from "axios";
import { PlaylistInfo } from "../types/playlist";
import { SearchResult } from "../types/search";
import { getCookie } from "../utils/getCookie";

export async function getPlaylist(playlistId: string): Promise<PlaylistInfo> {
  const url = `https://www.youtube.com/playlist?list=${playlistId}`;
  const res: {
    status: number;
    data?: any;
    err?: any;
  } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      "Accept-Language": "ko-KR,en-US,en;q=0.9",
      "Cookie": getCookie(),
    }
  }).then(v => ({
    status: v.status,
    data: v.data
  })).catch((err) => ({
    status: -1,
    err: err?.reponse?.message
  }));
  if (!res.data || res.err) throw new Error(res.err || "오류발생");
  const ytInitMatch = res.data.match(/var ytInitialData = (.*?});/);
  if (!ytInitMatch) throw new Error("플레이리스트 데이터 추출 실패");

  const ytData = JSON.parse(ytInitMatch[1]);
  const metaData = ytData?.metadata?.playlistMetadataRenderer;
  const contents = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer;

  if (metaData === undefined || contents === undefined) throw new Error("플레이리스트 가져오기 오류");

  const videos: SearchResult[] = [];

  for (const item of contents.contents) {
    const video = item.playlistVideoRenderer;
    if (!video) continue;
    const title = video.title.runs?.[0]?.text;
    const channelId = video.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
    const channelName = video.shortBylineText?.runs?.[0]?.text;
    const duration = video.lengthText?.simpleText;
    if (!title || !channelId || !channelName || !duration) continue;
    videos.push({
      videoId: video.videoId,
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
    title: metaData.title,
    total: videos.length,
    videos,
  };
}