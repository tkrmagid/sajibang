import axios from "axios";
import { getCookie } from "../../utils/getCookie";
import { defaultHeader } from "../../utils/getHeader";

export async function getClientVersion(): Promise<string> {
  const url = `https://music.youtube.com/`;
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
  const ytInitMatch = res.data.match(/ytcfg\.set\((.*?)\);/);
  if (!ytInitMatch) throw new Error("데이터 추출 실패");
  
  const ytData = JSON.parse(ytInitMatch[1]);

  return ytData.INNERTUBE_CLIENT_VERSION || "";
}