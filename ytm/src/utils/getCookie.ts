// 배포할땐 dotenv빼기
// import "dotenv/config";
import { Cookies } from "../types/cookie";

const defaultCookies: Cookies[] = [
  Cookies.YSC,
  Cookies.SID,
  Cookies.HSID,
  Cookies.SSID,
  Cookies.LOGIN_INFO,
  Cookies.SAPISID,
  Cookies.APISID,
  Cookies.Secure1PAPISID,
  Cookies.Secure3PAPISID,
  // Cookies.Secure1PSID, // 광고관련
  // Cookies.Secure3PSID, // 광고관련
  Cookies.Secure1PSIDCC,
  Cookies.Secure3PSIDCC,
  Cookies.Secure1PSIDTS,
  Cookies.Secure3PSIDTS,
  Cookies.SIDCC,
  Cookies.VISITOR_INFO1_LIVE,
  Cookies.PREF,
];

const customPREF = "tz=Asia.Seoul&hl=ko&gl=KR&last_quality=1080";

export function getCookie(keys: Cookies[] = defaultCookies, blocks?: Cookies[]): string {
  const text = process.env.COOKIE?.trim();
  if (!text) throw new ReferenceError("env: COOKIE is missing");
  const cookies = Object.fromEntries(
    text
    .split(";")
    .map(v => v.trim())
    .filter(v => v.includes("="))
    .map(v => {
      const [k, ...vs] = v.split("=");
      return [k.trim(), vs.join("=").trim()];
    })
  );
  cookies["PREF"] = customPREF;
  
  const allows = keys.filter(k => (k in cookies) && !(k in (blocks || [])));

  const missing = allows.filter(k => !(k in cookies));
  if (missing.length > 0) throw new Error(`다음 쿠키가 누락되었습니다: ${missing.join(", ")}`);

  return allows.map(k => k+"="+cookies[k]).join("; ");
}