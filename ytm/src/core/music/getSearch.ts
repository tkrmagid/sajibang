import axios from "axios";
import { ItemType, SearchResult } from "../../types/search";
import { getCookie } from "../../utils/getCookie";
import { defaultHeader } from "../../utils/getHeader";
import { decodeHex } from "../../utils/decoder";

export async function getSearch(query: string): Promise<SearchResult[]> {
  const url = `https://music.youtube.com/search?q=${encodeURIComponent(query)}`;
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
  if (!ytInitMatchs) throw new Error("검색 데이터 추출 실패");
  const ytInitMatch = ytInitMatchs.find(v => v[1].includes("/search"));
  if (!ytInitMatch) throw new Error("검색 데이터 추출 실패2");
  const ytInitText = decodeHex(ytInitMatch[1])?.split("data: '")?.[1]?.slice(0,-2);
  if (!ytInitText) throw new Error("검색 데이터 추출 실패3");
  const ytData = JSON.parse(ytInitText);

  const contents = ytData.contents.tabbedSearchResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents;
  if (!contents) throw new Error("검색 가져오기 오류");
  
  const videoItems: SearchResult[] = [];
  const okTypes: ItemType[] = [ "노래" ];

  for (const section of contents) {
    if (section.musicCardShelfRenderer) {
      const type = section.musicCardShelfRenderer.subtitle?.runs?.[0]?.text || "";
      if (!okTypes.includes(type)) continue;
      const videoId = section.musicCardShelfRenderer.title?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId;
      const title = section.musicCardShelfRenderer.title?.runs?.[0]?.text;
      const channelId = section.musicCardShelfRenderer.subtitle?.runs?.[2]?.navigationEndpoint?.browseEndpoint?.browseId;
      const channelName = section.musicCardShelfRenderer.subtitle?.runs?.[2]?.text;
      const duration = section.musicCardShelfRenderer.subtitle?.runs?.[4]?.text;
      if (!videoId || !title || !channelId || !channelName || !duration) continue;
      videoItems.push({
        videoId,
        title,
        channel: {
          id: channelId,
          name: channelName,
        },
        thumbnail: section.musicCardShelfRenderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.pop()?.url || "",
        duration,
      });
      continue;
    }
    const items = section.musicShelfRenderer;
    if (!items || !items.contents) continue;
    const type = items.title?.runs?.[0]?.text || "";
    if (!okTypes.includes(type)) continue;
    for (const item of items.contents) {
      const video = item.musicResponsiveListItemRenderer;
      if (!video) continue;
      const videoId = video.playlistItemData?.videoId;
      const title = video.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
      const channelId = video.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
      const channelName = video.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
      const duration = video.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[4]?.text;
      if (!videoId || !title || !channelId || !channelName || !duration) continue;
      if (videoItems.some(v => v.videoId === videoId)) continue;
      videoItems.push({
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
  }
  return videoItems.length > 10 ? videoItems.slice(0, 10) : videoItems;
}