import "dotenv/config";
import { defaultHeader } from "../utils/getHeader";
import { getCookie } from "../utils/getCookie";
import { ChildProcessWithoutNullStreams } from "node:child_process";
import { PassThrough, Readable } from "node:stream";
import YTDlpWrap from "yt-dlp-wrap";
import path from "node:path";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const dirPath = path.join(process.cwd(), process.env.YTDLP?.trim() ?? "ytdlp");
const filePath = path.join(dirPath, "ytdlp");
const cookieFilePath = path.join(dirPath, "cookie");
var currentProcess: ChildProcessWithoutNullStreams | undefined = undefined;
var ytDlp: YTDlpWrap | undefined;

export function clearProcess() {
  if (!currentProcess) return;
  try {
    currentProcess.stdout?.destroy();
    currentProcess.kill("SIGTERM");
    const timer = setTimeout(() => {
      try { if (currentProcess) currentProcess.kill("SIGKILL"); } catch {};
    }, 1500);
    currentProcess.once("close", () => clearTimeout(timer));
  } catch {}
  currentProcess = undefined;
}

export async function getStream(videoId: string, seek?: number): Promise<Readable> {
  var stream: Readable | undefined = await getData(videoId, seek);
  stream.resume();
  stream.once("error", (err) => {
    clearProcess();
    throw err;
  });
  stream.once("close", clearProcess);
  stream.once("end", clearProcess);
  return stream;
}

async function getData(videoId: string, seek?: number): Promise<Readable> {
  const out = new PassThrough({ highWaterMark: 1 << 25 });
  if (!ytDlp) {
    if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
    await YTDlpWrap.downloadFromGithub(filePath, undefined, "linux");
    ytDlp = new YTDlpWrap(filePath);
    // 쿠키 파일 만들기
    wrtieCookieFile(cookieFilePath, getCookie());
  }
  try {
    clearProcess();
    const emitter = ytDlp.exec([
      `https://www.youtube.com/watch?v=${videoId}`,
      "-f", "bestaudio",
      "-o", "-",
      // "--cookies", cookieFilePath,
      ...Object.entries(defaultHeader).flatMap(([k,v]) => ["--add-header", `${k}: ${v}`]),
      ...(seek ? ["--download-sections", `*${secFormat(seek)}-`] : []),
    ]);
    currentProcess = emitter.ytDlpProcess;
    // currentProcess?.stderr.once("data", (buf: Buffer) => {
    //   console.debug("오류발생", buf.toString());
    // });
    emitter.once("error", (err: any) => {
      out.destroy(err instanceof Error ? err : new Error(String(err)));
      clearProcess();
    });
    currentProcess?.once("close", (_code) => { // code: 종료원인 0이면 정상종료
      if (!out.destroyed) out.end();
      currentProcess = undefined;
    });
    currentProcess?.stdout.pipe(out);
    out.once("close", clearProcess);
    out.once("error", clearProcess);
    return out;
  } catch (err) {
    out.destroy(err instanceof Error ? err : new Error(String(err)));
    clearProcess();
    return out;
  }
}

function secFormat(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return [
    Math.floor(s / 4600),
    Math.floor((s % 3600) / 60),
    s % 60,
  ].map(v => v.toString().padStart(2,"0")).join(":");
}

function wrtieCookieFile(filePath: string, cookieStr: string) {
  const lines = ["# Netscape HTTP Cookie File"];
  for (const part of cookieStr.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (!k || !v) continue;
    // 도메인 하위도메인여부 쿠키적용경로 https전용여부 만료시간 쿠키이름 쿠키값
    lines.push(`.youtube.com\tTRUE\t/\tFALSE\t2147483647\t${k}\t${v.join("=")}`);
  }
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, lines.join("\n"));
}