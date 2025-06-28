// PREFIX <- content/utils.js

const URLALL = window.location.href; // 전체주소
const DOMAIN = window.location.hostname; // 도메인
const PATHNAME = window.location.pathname; // 경로 (/page 등)
const PROTOCOL = window.location.protocol; // http or https

// jsToggle 확인후 설정
chrome.storage.local.get("jsToggle", ({ jsToggle }) => {
  if (!jsToggle) return console.log(PREFIX,"자동 스크립트가 꺼져있습니다.");
  console.log(PREFIX,"자동 스크립트 실행");
  jsMain(); // content/jsMain.js
});

// choToggle 확인후 설정
chrome.storage.local.get("choToggle", ({ choToggle }) => {
  if (!choToggle) return;
  console.log(PREFIX,"초성검색 실행");
  choMain(); // content/choMain.js
});

window.addEventListener("g-sentry", (e) => {
  if (!e.detail || typeof(e.detail) !== "object") return console.error(PREFIX,"detail형식이 올바르지 않습니다.");
  if (!e.detail?.event) return console.error(PREFIX,"detail에는 event가 포함되어야합니다.");
  const args = e.detail.event.split(".").map(v => v.trim()).filter(v => v !== "");
  userEvent(args, e.detail.data);
});
