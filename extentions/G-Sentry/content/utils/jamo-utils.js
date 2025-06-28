const CHO_LIST = [ "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ" ];
const JUNG_LIST = [ "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ" ];
const JONG_LIST = [ "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ" ];


/**
 * 초성 추출
 * @param {string} str 초성가져올 한글
 * @returns {string} 초성들
 */
function extractChosung(str) {
  let result = "";
  for (let char of str) {
    const code = char.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const choIndex = Math.floor((code - 0xAC00) / (21*28));
      result += CHO_LIST[choIndex];
    } else {
      result += char;
    }
  }
  return result;
}

/**
 * 한글 분해
 * @param {string} str 분해할 한글
 * @returns {string[][]} 분해된 한글
 */
function hangulBreaker(str) {
  let result = [];
  for (let char of str) {
    const code = char.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const uni = code - 0xAC00;
      const cho = Math.floor(uni / (21*28));
      const jung = Math.floor((uni % (21*28)) / 28);
      const jong = uni % 28;

      result.push([ CHO_LIST[cho], JUNG_LIST[jung], JONG_LIST[jong] ]);
    } else {
      result.push([ char ]);
    }
  }
  return result;
}

/**
 * 한글 결합
 * @param {string[][]} jamoArr 분해된 한글 리스트
 * @returns {string} 결합된 한글
 */
function hangulAssembler(jamoArr) {
  let result = [];
  for (let jamos of jamoArr) {
    if (jamos.length === 1) {
      result.push(jamos[0]);
      continue;
    }
    const choIndex = CHO_LIST.indexOf(jamos[0]);
    const jungIndex = JUNG_LIST.indexOf(jamos[1]);
    const jongIndex = jamos[2] ? JONG_LIST.indexOf(jamos[2]) : 0;

    if (choIndex === -1 || jungIndex === -1 || jongIndex === -1) {
      // 오류: 유효하지 않은 자모
      result.push(jamos.join(""));
      continue;
    }

    const code = 0xAC00 + (choIndex*21*28) + (jungIndex*28) + jongIndex;
    result.push(String.fromCharCode(code));
  }
  return result.join("");
}