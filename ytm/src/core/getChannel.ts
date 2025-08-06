import axios from "axios";
import { ChannelInfo } from "../types/channel";
import { getCookie } from "../utils/getCookie";

export async function getChannel(channelId: string): Promise<ChannelInfo> {
  const url = `https://www.youtube.com/channel/${channelId}`;
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
  if (!ytInitMatch) throw new Error("채널 데이터 추출 실패");

  const ytData = JSON.parse(ytInitMatch[1]);
  const metaData = ytData?.metadata?.channelMetadataRenderer;

  if (metaData === undefined) throw new Error("채널 가져오기 오류");

  return {
    id: channelId,
    tag: metaData.vanityChannelUrl.replace("http://www.youtube.com/",""),
    name: metaData.title,
    avatar: metaData.avatar.thumbnails.pop()?.url || "",
  };
}