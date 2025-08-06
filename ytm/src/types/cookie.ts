export enum Cookies {
  /** 세션, 재생 추적, 봇 감지 */
  YSC = "YSC",
  /** 세션 ID, 로그인 상태 인증 */
  SID = "SID",
  /** 로그인 세션 서명용 */
  HSID = "HSID",
  /** 계정 관련 보조인증 */
  SSID = "SSID",
  /** 유튜브 로그인 정보 */
  LOGIN_INFO = "LOGIN_INFO",
  /** 보안된 인증 토큰 (YouTube용) */
  SAPISID = "SAPISID",
  /** API 인증용 쿠키 */
  APISID = "APISID",
  /** 유튜브 요청 시 인증 */
  Secure1PAPISID = "__Secure-1PAPISID",
  /** 유튜브 요청 시 인증 (써드파티) */
  Secure3PAPISID = "__Secure-3PAPISID",
  /** 광고 및 인증 관련 */
  Secure1PSID = "__Secure-1PSID",
  /** 광고 및 인증 관련 (써드파티) */
  Secure3PSID = "__Secure-3PSID",
  /** 무결성 검증, 세션 탈취 방지 쿠키 */
  Secure1PSIDCC = "__Secure-1PSIDCC",
  /** 무결성 검증, 세션 탈취 방지 쿠키 (써드파티) */
  Secure3PSIDCC = "__Secure-3PSIDCC",
  /** 인증 세션 타임스탬프 쿠키 */
  Secure1PSIDTS = "__Secure-1PSIDTS",
  /** 인증 세션 타임스탬프 쿠키 (써드파티) */
  Secure3PSIDTS = "__Secure-3PSIDTS",
  /** 쿠키 위조 방지 (보안 강화) */
  SIDCC = "SIDCC",
  /** 유튜브 설정 정보 */
  VISITOR_INFO1_LIVE = "VISITOR_INFO1_LIVE",
  /** 선호 설정 저장 (VISITOR_INFO1_LIVE 같이쓰면 좋음) */
  PREF = "PREF",
};
