import { TEST_fetchNameList } from "./utils.js";

console.log("G-Sentry 실행시작!");

const ALLOW_DOMAINS = [
  "google.com",
];

async function init() {
  // 전체 탭 아이콘, 클릭팝업 업데이트
  chrome.tabs.query({}, (tabs) => tabs.forEach(updateAction));

  // 기본 실행
  await TEST_fetchNameList();
  await showDB();
}

async function showDB() {
  try {
    const keys = await chrome.storage.local.getKeys();
    const items = await chrome.storage.local.get(keys);
    console.log(`DB전체 출력: 총${Object.keys(items).length}개`);
    keys.forEach((item, index) => {
      console.log(`${index+1}. ${item}:`, items[item]);
    });
  } catch (err) {
    console.error("DB전체 출력 오류:", err);
  }
}



// 크롬 실행 시
chrome.runtime.onStartup.addListener(() => init());
chrome.runtime.onInstalled.addListener(() => init());


// 탭 활성화 시
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, updateAction);
});
// 탭 주소 바뀔 시
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") updateAction(tab);
});

/**
 * 도메인 확인
 * @param {string} url 도메인확인할 주소
 * @returns {boolean} 허용된 도메인인지
 */
function isAllowed(url="") {
  try {
    const hostname = new URL(url).hostname;
    return ALLOW_DOMAINS.some(v => hostname.includes(v));
  } catch {
    return false;
  }
}
/**
 * update tab
 * @param {chrome.tabs.Tab | undefined} tab tab
 */
function updateAction(tab) {
  const allowed = isAllowed(tab?.url);

  // 아이콘 설정
  chrome.action.setIcon({
    tabId: tab.id,
    path: allowed ? "../front/icon.png" : "../front/icon_gray.png"
  });
  // 클릭 팝업 설정
  chrome.action.setPopup({
    tabId: tab.id,
    popup: allowed ? "../front/popup.html" : ""
  });
}