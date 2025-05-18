/** @type {import('./@types/songs.type.js').SongData[]} */
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
]


/** @type {import('./@types/songs.type.js').SongData[]} */
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
]

/** @type {import('./@types/songs.type.js').SongData[]} */
const SONGS = [...USER_SONGS, ...DEFAULT_SONGS];
