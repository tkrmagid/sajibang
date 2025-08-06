import axios from "axios";
import { VideoInfo } from "../types/video";
import { getCookie } from "../utils/getCookie";

const checkRegions = [ "KR" ];

export async function getVideo(videoId: string): Promise<VideoInfo> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
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
  const ytInitMatch = res.data.match(/var ytInitialPlayerResponse = (.*?});/);
  if (!ytInitMatch) throw new Error("영상 데이터 추출 실패");

  const ytData = JSON.parse(ytInitMatch[1]);
  const videoDetails = ytData?.videoDetails;
  const microformat = ytData?.microformat;
  const status = ytData?.playabilityStatus?.status;
  const reason = ytData?.playabilityStatus?.reason;

  if (status !== "OK") throw new Error(status + " : " + reason);
  if (videoDetails === undefined || microformat === undefined) throw new Error("영상 가져오기 오류");

  return {
    videoId: videoDetails.videoId,
    title: videoDetails.title,
    channel: {
      id: videoDetails.channelId,
      name: videoDetails.author.replace(" - Topic","")
    },
    thumbnail: videoDetails.thumbnail.thumbnails.pop()?.url || '',
    duration: parseInt(videoDetails.lengthSeconds),
    regions: Object.fromEntries(checkRegions.map(k => [k, microformat.playerMicroformatRenderer.availableCountries.includes(k)])),
  };
}