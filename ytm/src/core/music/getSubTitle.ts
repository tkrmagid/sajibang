import axios from "axios";
import { getCookie } from "../../utils/getCookie";
import { defaultHeader } from "../../utils/getHeader";

export async function getSubTitle(clientVersion: string, videoId: string, browseId?: string): Promise<string[]> {
  const url = `https://music.youtube.com/youtubei/v1/${
    browseId ? "browse" : "next"
  }?prettyPrint=false`;
  const res: {
    status: number;
    data?: any;
    err?: any;
  } = await axios.post(url, {
    videoId: videoId,
    playlistId: "",
    browseId: browseId || "",
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

  if (!browseId) {
    const contents = res.data.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs;
    if (!contents) throw new Error("가사 가져오기 오류");
    const getBrowseId = contents.find((v: any) => v.tabRenderer?.title === "가사")?.tabRenderer?.endpoint?.browseEndpoint?.browseId;
    if (!getBrowseId) return [];
    return await getSubTitle(clientVersion, videoId, getBrowseId);
  }
  
  const status = res.data.contents?.messageRenderer?.text?.runs?.[0]?.text;
  if (status === "가사가 제공되지 않음") return [ "가사가 제공되지 않음" ];

  const contents: string | undefined = res.data.contents?.sectionListRenderer?.contents?.[0]?.musicDescriptionShelfRenderer?.description?.runs?.[0]?.text;
  if (!contents) return [];

  return contents.split("\n").map(v => v.trim());
}