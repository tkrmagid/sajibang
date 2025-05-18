import correction from './charts/correction.js';
import iu_eight from './charts/iu_eight.js';
import test from './charts/test.js';


/** @type {import('./songs_type.js').SongData} */
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
    chart: iu_eight,
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
    chart: test,
  },
]


/** @type {import('./songs_type.js').SongData} */
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
    chart: correction,
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
]

/** @type {import('./songs_type.js').SongData} */
export const SONGS = [...USER_SONGS, ...DEFAULT_SONGS];
