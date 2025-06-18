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

/** @type {SongData[]} */
const USER_SONGS = [
  {
    name: '아이유 - 에잇',
    show: true,
    song: {
      url: '202101/3857541489781049/3857541489781049.smil',
      isPlayable: true,
      startTime: 1146,
      endTime: 1296,
    },
    chart: CHART_iu_eight,
  },
  {
    name: '테스트곡',
    show: true,
    song: {
      url: '',
      isPlayable: false,
      startTime: 0,
      endTime: 10,
    },
    chart: CHART_test,
  },
];


/** @type {SongData[]} */
const DEFAULT_SONGS = [
  {
    name: 'correction',
    show: false,
    song: {
      url: '',
      isPlayable: false,
      startTime: 0,
      endTime: 1,
    },
    chart: CHART_correction,
  },
  {
    name: 'makeNote',
    show: false,
    song: {
      url: '',
      isPlayable: false,
      startTime: 0,
      endTime: 60*60,
    },
    chart: [],
  },
];

/** @type {SongData} */
const SONGS = [...USER_SONGS, ...DEFAULT_SONGS];
