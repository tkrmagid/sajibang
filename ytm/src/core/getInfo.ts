import axios from "axios";
import * as cheerio from "cheerio";
import { VideoInfo } from "../types/videoInfo";

export async function getInfo(videoId: string): Promise<VideoInfo> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const res: {
    status: number;
    data?: any;
    err?: any;
  } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      "Accept-Language": "ko-KR,en-US,en;q=0.9",
      // 로그인 쿠키 넣어야함
    }
  }).then(v => ({
    status: v.status,
    data: v.data
  })).catch((err) => ({
    status: -1,
    err: err?.reponse?.message
  }));
  if (!res.data || res.err) throw new Error(res.err || "오류발생");
  const ytInitMatch = res.data.match(/var ytInitialPlayerResponse = (.*?});/);
  if (!ytInitMatch) throw new Error('유튜브 데이터 추출 실패');

  const ytData = JSON.parse(ytInitMatch[1]);
  const videoDetails = ytData.videoDetails;
  const microformat = ytData.microformat;
  const status = ytData?.playabilityStatus?.status;
  const reason = ytData?.playabilityStatus?.reason;

  if (status !== "OK") throw new Error(status + " : " + reason);

  return {
    videoId: videoDetails.videoId,
    title: videoDetails.title,
    channel: {
      id: videoDetails.channelId,
      name: videoDetails.author.replace(" - Topic","")
    },
    thumbnail: videoDetails.thumbnail.thumbnails.pop()?.url || '',
    duration: parseInt(videoDetails.lengthSeconds),
    regions: microformat.playerMicroformatRenderer.availableCountries,
  };
}