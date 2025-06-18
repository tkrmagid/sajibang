/**
 * @typedef {Object} Chart
 * @property {number} time - 노트가 등장하는 시간(밀리초)
 * @property {number} lane - 노트가 등장하는 라인 번호
 * @property {number} [endTime] - 롱노트의 경우 노트 종료 시간(밀리초) (선택적)
 */

/** @type {Chart[]} */
const CHART_correction = [
  { time: 1000, lane: 1 },
  { time: 2000, lane: 1 },
  { time: 3000, lane: 1 },
  { time: 4000, lane: 1 },
];