const FETCH_URL = "위병사이트주소";

/**
 * @typedef {{ rank: string; name: string; cho: string[]; }[]} NameListType
 */

/**
 * 이름목록 가져오기
 * @param {string} [date] 날짜 ex: 20250625
 * @returns {Promise(void)} 리턴 없음
 */
export async function fetchNameList(date) {
  try {
    if (!date) {
      const D = new Date();
      date = D.getFullYear().toString()
        + (D.getMonth()+1 < 10 ? '0'+(D.getMonth()+1) : D.getMonth()+1)
        + D.getDate();
    }
    const response = await fetch(FETCH_URL, {
      method: "POST", // GET, POST
      headers: { "Content-Type": "application/json", },
      credentials: "include", // 쿠키 전송 방식
      body: JSON.stringify({ // POST body
        // 위병사이트 body param
      }),
    });
    if (response.status === 404) throw new Error(response.statusText);
    /** @type {NameListType} */
    let data = (await response.json()).map(v => ({ rank: v.gioPsnRankNm, name: v.giopsnFulNm, cho: []}));
    /** @type {{ nameList?: NameListType }} */
    const { nameList } = await chrome.storage.local.get("nameList");
    if (nameList?.length > 0) for (let person of nameList) {
      let dataIndex = data.findIndex(v => v.rank === person.rank && v.name === person.name);
      if (dataIndex === -1) continue;
      data[dataIndex].cho = person.cho;
    }
    await chrome.storage.local.set({ nameList: data });
    console.log("이름 목록 저장 완료:", `총 ${nameList.length}명`);
  } catch (err) {
    console.error("이름 목록 저장 실패:", err);
  }
}

/**
 * 이름목록 가져오기 (test)
 * @returns {Promise(void)} 리턴 없음
 */
export async function TEST_fetchNameList() {
  try {
    /** @type {NameListType} */
    let data = [
      { rank: "하사", name: "홍길동", cho: ["ㅎㄱㄷ"] },
      { rank: "하사", name: "김철수", cho: [] },
      { rank: "하사", name: "김철수1", cho: [] },
      { rank: "하사", name: "김철수2", cho: [] },
      { rank: "하사", name: "김철수3", cho: [] },
      { rank: "하사", name: "김철수4", cho: [] },
      { rank: "하사", name: "김철수5", cho: [] },
      { rank: "하사", name: "김철수6", cho: [] },
      { rank: "하사", name: "김철수7", cho: [] },
      { rank: "하사", name: "김철수8", cho: [] },
      { rank: "하사", name: "김철수9", cho: [] },
      { rank: "하사", name: "김철수10", cho: [] },
      { rank: "하사", name: "김철수11", cho: [] },
      { rank: "하사", name: "김철수12", cho: [] },
      { rank: "하사", name: "김철수13", cho: [] },
      { rank: "하사", name: "김철수14", cho: [] },
      { rank: "하사", name: "김철수15", cho: [] },
      { rank: "하사", name: "김철수16", cho: [] },
      { rank: "하사", name: "김철수17", cho: [] },
      { rank: "하사", name: "김철수18", cho: [] },
      { rank: "하사", name: "김철수19", cho: [] },
      { rank: "하사", name: "김철수20", cho: [] },
      { rank: "하사", name: "김철수21", cho: [] },
      { rank: "하사", name: "김철수22", cho: [] },
      { rank: "하사", name: "김철수23", cho: [] },
      { rank: "하사", name: "김철수24", cho: [] },
      { rank: "하사", name: "김철수25", cho: [] },
      { rank: "하사", name: "김철수26", cho: [] },
      { rank: "하사", name: "김철수27", cho: [] },
      { rank: "하사", name: "김철수28", cho: [] },
      { rank: "하사", name: "김철수29", cho: [] },
      { rank: "하사", name: "김철수30", cho: [] },
      { rank: "하사", name: "김철수31", cho: [] },
    ];
    /** @type {{ nameList?: NameListType }} */
    const { nameList } = await chrome.storage.local.get("nameList");
    if (nameList?.length > 0) for (let person of nameList) {
      let dataIndex = data.findIndex(v => v.rank === person.rank && v.name === person.name);
      if (dataIndex === -1) continue;
      data[dataIndex].cho = person.cho;
    }
    await chrome.storage.local.set({ nameList: data });
    console.log("이름 목록 저장 완료:", `총 ${data.length}명`);
    return; // 테스트 코드 끝
  } catch (err) {
    console.error("이름 목록 저장 실패:", err);
  }
}