/**
 * @typedef {Object} Song
 * @property {string} url - 곡의 URL
 * @property {boolean} isPlayable - 곡 재생 가능 여부
 * @property {number} startTime - 곡 시작 시간(초)
 * @property {number} endTime - 곡 종료 시간(초)
 */

/**
 * @typedef {Object} Chart
 * @property {number} time - 노트가 등장하는 시간(밀리초)
 * @property {number} lane - 노트가 등장하는 라인 번호
 * @property {number} [endTime] - 롱노트의 경우 노트 종료 시간(밀리초) (선택적)
 */

/**
 * @typedef {Object} SongData
 * @property {string} name - 곡 이름
 * @property {boolean} show - 곡 표시 여부
 * @property {Song} song - 곡 정보 객체
 * @property {Chart[]} chart - 노트 정보 배열
 */

export {};