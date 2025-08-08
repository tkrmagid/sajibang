import axios from "axios";
import { SearchResult } from "../../types/search";
import { getCookie } from "../../utils/getCookie";
import { clientVersion, defaultHeader } from "../../utils/getHeader";

export async function getRecommend(videoId: string, playlistId?: string): Promise<SearchResult[]> {
  const url = `https://music.youtube.com/youtubei/v1/next?prettyPrint=false`;
  const res: {
    status: number;
    data?: any;
    err?: any;
  } = await axios.post(url, {
    videoId: videoId,
    playlistId: playlistId || "",
    isAudioOnly: true,
    context: {
      client: {
        clientName: "WEB_REMIX",
        clientVersion: clientVersion,
        osName: "Windows",
        osVersion: "10.0",
        platform: "DESKTOP",
        gl: "KR",
        hl: "ko",
        timeZone: "Asia/Seoul",
        userAgent: defaultHeader["User-Agent"],
      },
    },
  }, {
    headers: {
      ...defaultHeader,
      "Cookie": getCookie(),
    }
  }).then(v => ({
    status: v.status,
    data: v.data
  })).catch((err) => ({
    status: err?.response?.data?.error?.code || -1,
    err: err?.response?.data?.error?.message || "오류발생"
  }));
  if (!res.data || res.err) throw new Error(res.err || "오류발생");

  const contents = res.data.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.musicQueueRenderer?.content?.playlistPanelRenderer?.contents;
  if (!contents) throw new Error("추천 가져오기 오류");

  if (!playlistId) {
    const getPlaylistId = contents.find((v: any) => v.automixPreviewVideoRenderer)?.automixPreviewVideoRenderer?.content?.automixPlaylistVideoRenderer?.navigationEndpoint?.watchPlaylistEndpoint?.playlistId;
    if (!getPlaylistId) return [];
    return await getRecommend(videoId, getPlaylistId);
  }

  const videoItems: SearchResult[] = [];

  for (const section of contents) {
    const video = section.playlistPanelVideoRenderer;
    if (!video) continue;
    const videoId2 = video.videoId;
    const title = video.title?.runs?.[0]?.text;
    const channelId = video.longBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
    const channelName = video.longBylineText?.runs?.[0]?.text;
    const duration = video.lengthText?.runs?.[0]?.text;
    if (!videoId2 || !title || !channelId || !channelName || !duration) continue;
    if (videoId2 === videoId) continue;
    videoItems.push({
      videoId: videoId2,
      title,
      channel: {
        id: channelId,
        name: channelName,
      },
      thumbnail: video.thumbnail?.thumbnails?.pop()?.url || "",
      duration,
    });
  }
  return videoItems;
}