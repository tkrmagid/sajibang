import axios from "axios";
import { VideoInfo } from "../types/video";
import { getCookie } from "../utils/getCookie";
import { defaultHeader } from "../utils/getHeader";

const checkRegions = [ "KR" ];

export async function getVideo(videoId: string): Promise<VideoInfo> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
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
  const ytInitMatch = res.data.match(/var ytInitialPlayerResponse = (.*?});/);
  if (!ytInitMatch) throw new Error("영상 데이터 추출 실패");

  const ytData = JSON.parse(ytInitMatch[1]);
  const videoDetails = ytData?.videoDetails;
  const microformat = ytData?.microformat;
  const status = ytData?.playabilityStatus?.status;
  const reason = ytData?.playabilityStatus?.reason;

  if (status !== "OK") throw new Error(status + " : " + reason);
  if (!videoDetails || !microformat) throw new Error("영상 가져오기 오류");

  return {
    videoId: videoDetails.videoId,
    title: videoDetails.title,
    channel: {
      id: videoDetails.channelId,
      name: videoDetails.author.replace(" - Topic","")
    },
    thumbnail: videoDetails.thumbnail.thumbnails.pop()?.url || "",
    duration: parseInt(videoDetails.lengthSeconds),
    regions: Object.fromEntries(checkRegions.map(k => [k, microformat.playerMicroformatRenderer.availableCountries.includes(k)])),
  };
}