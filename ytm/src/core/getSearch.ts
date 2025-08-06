import axios from "axios";
import { SearchResult } from "../types/search";
import { getCookie } from "../utils/getCookie";

export async function searchVideo(query: string): Promise<SearchResult[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
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
  if (!ytInitMatch) throw new Error("검색 데이터 추출 실패");

  const ytData = JSON.parse(ytInitMatch[1]);
  const contents = ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
  if (contents === undefined) throw new Error("검색 가져오기 오류");

  const videoItems: SearchResult[] = [];
  for (const section of contents) {
    const items = section.itemSectionRenderer?.contents;
    if (!items) continue;
    for (const item of items) {
      const video = item.videoRenderer;
      if (!video) continue;
      const title = video.title.runs?.[0]?.text;
      const channelId = video.longBylineText.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
      const channelName = video.longBylineText.runs?.[0]?.text;
      const duration = video.lengthText?.simpleText;
      if (!title || !channelId || !channelName || !duration) continue;
      videoItems.push({
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
  }
  return videoItems.length > 10 ? videoItems.slice(0, 10) : videoItems;
}