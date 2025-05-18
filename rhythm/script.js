import { SONGS } from './songs/songs.js';

function formatTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const milliseconds = Math.floor((time % 1) * 100);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
}

if (!window.localStorage.getItem('keys')) window.localStorage.setItem('keys', JSON.stringify(['d', 'f', 'j', 'k'])); // 기본 키설정
if (!window.localStorage.getItem('noteSpeed')) window.localStorage.setItem('noteSpeed', '20'); // 기본 속도 (단위: 픽셀/프레임)
if (!window.localStorage.getItem('correction')) window.localStorage.setItem('correction', '0'); // 보정값
if (!window.localStorage.getItem('volume')) window.localStorage.setItem('volume', '50'); // 볼륨

class GameClass {
  // 유저 설정
  hitLineHeight = 190; // 히트라인 높이 (캔버스 아래에서부터의 거리)
  keyboardHeight = 120; // 키보드 높이 (캔버스 아래에서부터의 거리)
  feedbackDuration = 5000; // 피드백 지속 시간 (ms)
  effectSize = 15; // 이펙트 크기
  effectDuration = 100; // 이펙트 지속 시간 (ms)
  effectTransparentcy = 0.2; // 이펙트 투명도 (1.0 불투명)


  // 판정 거리 (히트라인으로부터의 픽셀)
  perfectDistance = 30;
  greatDistance = 60;
  badDistance = 90;
  missDistance = 90; // 너무 멀리있는데 인식되는걸 방지하기위해서



  // 메뉴 관련
  menu = document.getElementById('menu');
  correctionElement = document.getElementById('correction');
  volumeSlider = document.getElementById('volumeSlider');
  volumeValue = document.getElementById('volumeValue');
  
  // 버튼 관련
  startButton = document.getElementById('startButton');
  correctionButton = document.getElementById('correctionButton');
  customButton = document.getElementById('customButton');
  mainButton = document.getElementById('mainButton');
  backButton = document.getElementById('backButton');
  makeButton = document.getElementById('makeButton');
  retryButton = document.getElementById('retryButton');
  settingButton = document.getElementById('settingButton');
  settingSaveButton = document.getElementById('settingSaveButton');
  settingCloseButton = document.getElementById('settingCloseButton');

  // 노래선택 관련
  songSelection = document.getElementById('songSelection');
  songList = document.getElementById('songList');

  // 게임 관련
  gameDIV = document.getElementById('gameDIV');
  gameTimer = document.getElementById('gameTimer');
  gameFeedbackCounts = document.getElementById('gameFeedbackCounts');
  gameCanvas = document.getElementById('gameCanvas');
  ctx = this.gameCanvas.getContext('2d');

  // 팝업 관련
  backdrop = document.getElementById('backdrop');
  gamePopup = document.getElementById('gamePopup');
  popupTitle = document.getElementById('popupTitle');
  popupScore = document.getElementById('popupScore');

  // 설정 팝업 관련
  settingPopup = document.getElementById('settingPopup');
  keyInputs = [
    document.getElementById('key0'),
    document.getElementById('key1'),
    document.getElementById('key2'),
    document.getElementById('key3'),
  ];
  noteSpeedSlider = document.getElementById('noteSpeedSlider');
  noteSpeedValue = document.getElementById('noteSpeedValue');

  // 변수 선언
  // jwplayer 관련
  player = null; // jwplayer

  // 캔버스 관련
  canvasWidth = 450; // 캔버스 너비
  canvasHeight = 750; // 캔버스 높이
  laneWidth = this.canvasWidth/4; // 한줄 너비
  noteWidth = this.laneWidth - 20; // 노트 너비
  noteHeight = 20; // 노트 높이

  // 게임 관련
  gameRunning = false; // 게임 진행 중인지 여부
  gameEndTime = 0; // 게임 총 시간 (초)
  gameTime = 0.00; // 게임 시간 (초)
  gameTimerInterval = null; // 게임 타이머 인터벌
  gameFrameId = null; // 게임 프레임 ID
  gameSong = null; // 게임 노래
  notes = []; // 노트 배열
  perfectCount = 0; // 완벽 카운트
  greatCount = 0; // 좋음 카운트
  badCount = 0; // 나쁨 카운트
  missCount = 0; // 놓침 카운트
  correctionList = []; // 보정값 리스트
  hitLineY = this.canvasHeight - this.hitLineHeight; // 히트라인 Y 좌표
  keyboardY = this.canvasHeight - this.keyboardHeight; // 키보드 Y 좌표
  activeKeys = new Set(); // 현재 눌린 키
  feedbackText = ''; // 피드백 텍스트
  feedbackTimeout = null; // 피드백 타임아웃
  spawnTimeoutList = []; // 노트 생성 타임아웃 리스트
  hitEffects = [null, null, null, null]; // 히트 이펙트 배열
  laneEffects = [null, null, null, null]; // 레인 이펙트 배열
  makeCharts = [];
  
  keys = JSON.parse(window.localStorage.getItem('keys'));
  noteSpeed = Number(window.localStorage.getItem('noteSpeed'));
  correctionValue = Number(window.localStorage.getItem('correction'));


  constructor() {
    this.gameCanvas.width = this.canvasWidth;
    this.gameCanvas.height = this.canvasHeight;

    // 불러오기
    this.volumeSlider.value = Number(window.localStorage.getItem('volume'));
    this.volumeValue.textContent = this.volumeSlider.value;
    this.noteSpeedSlider.value = this.noteSpeed;
    this.noteSpeedValue.textContent = noteSpeedSlider.value;
    this.correctionElement.textContent = `보정값: ${this.correctionValue}ms`;

    this.init();

    this.volumeSlider.addEventListener('input', () => {
      this.volumeValue.textContent = `${this.volumeSlider.value}%`;
      window.localStorage.setItem('volume', this.volumeSlider.value.toString());
    });
    this.noteSpeedSlider.addEventListener('input', () => {
      this.noteSpeedValue.textContent = `${this.noteSpeedSlider.value}`;
    });

    this.startButton.addEventListener('click', () => {
      this.menu.style.display = 'none';
      this.songSelection.style.display = 'block';
    });
    this.correctionButton.addEventListener('click', () => {
      if (DEV) console.log('보정 모드');
      this.correctionList = [];
      this.correctionValue = 0;
      this.gameSong = SONGS[SONGS.findIndex(song => song.name === 'correction')];
      this.startGame.call(this);
    });
    this.customButton.addEventListener('click', () => {
      if (DEV) console.log('유저 노트 생성');
      this.makeButton.style.display = 'block';
      this.gameSong = SONGS[SONGS.findIndex(song => song.name === 'makeNote')];
      this.startGame.call(this);
    });
    this.settingButton.addEventListener('click', () => {
      for (let i in this.keyInputs) this.keyInputs[i].value = this.keys[i];
      this.noteSpeedSlider.value = this.noteSpeed;
      this.noteSpeedValue.value = this.noteSpeed;
      this.settingPopup.style.display = 'block';
      this.backdrop.style.display = 'block';
    });
    this.settingSaveButton.addEventListener('click', () => {
      const newKeys = this.keyInputs.map(v => v.value.trim().toLocaleLowerCase());
      if (new Set(newKeys).size !== 4 || newKeys.some(k => !k)) {
        alert('키는 중복 없이 4개 모두 입력해야 합니다.');
        return;
      }
      this.keys = newKeys;
      this.noteSpeed = Number(this.noteSpeedSlider.value);
      window.localStorage.setItem('keys', JSON.stringify(this.keys));
      window.localStorage.setItem('noteSpeed', this.noteSpeed.toString());
      alert('설정완료');
      this.settingPopup.style.display = 'none';
      this.backdrop.style.display = 'none';
    });
    this.mainButton.addEventListener('click', this.init.bind(this));
    this.backButton.addEventListener('click', this.init.bind(this));
    this.makeButton.addEventListener('click', this.endGame.bind(this));
    this.retryButton.addEventListener('click', this.init.bind(this));
    this.settingCloseButton.addEventListener('click', this.init.bind(this));


    document.addEventListener('keydown', this.eventKeydown.bind(this));
    document.addEventListener('keyup', this.eventKeyup.bind(this));
  }

  init() {
    this.gameRunning = false;
    if (this.player !== null) this.player.remove();
    if (this.gameTimerInterval !== null) clearInterval(this.gameTimerInterval);
    if (this.gameFrameId !== null) cancelAnimationFrame(this.gameFrameId);
    if (this.feedbackTimeout !== null) clearTimeout(this.feedbackTimeout);
    if (this.spawnTimeoutList.length !== 0) for (let id of this.spawnTimeoutList) clearTimeout(id);

    this.player = null;
    this.gameEndTime = 0;
    this.gameTime = 0.00;
    this.gameTimerInterval = null;
    this.gameFrameId = null;
    this.gameSong = null;
    this.notes = [];
    this.perfectCount = 0;
    this.greatCount = 0;
    this.badCount = 0;
    this.missCount = 0;
    this.feedbackText = '';
    this.feedbackTimeout = null;
    this.spawnTimeoutList = [];
    this.hitEffects = [null, null, null, null];
    this.laneEffects = [null, null, null, null];
    this.activeKeys.clear();
    this.makeCharts = [];

    this.menu.style.display = 'block';
    this.songSelection.style.display = 'none';
    this.gameDIV.style.display = 'none';
    this.backdrop.style.display = 'none';
    this.gamePopup.style.display = 'none';
    this.settingPopup.style.display = 'none';
    this.makeButton.style.display = 'none';

    this.songList.innerHTML = ''; // 기존 노래 목록 초기화
    SONGS.forEach((song, index) => {
      if (!song.show) return; // 노래가 보이지 않도록 설정된 경우
      const li = document.createElement('li');
      li.textContent = song.name;
      li.id = `song-${index}`;
      li.classList.add('song-item');
      li.addEventListener('click', () => {
        this.gameSong = song;
        this.startGame();
      });
      this.songList.appendChild(li);
    });
  }

  initPlayer(url, startTime, endTime) {
    if (this.player) this.player.remove();

    this.player = jwplayer('player').setup({
      file: `https://media.dema.mil.kr/mediavod/_definst_/smil:dematv/${url}/playlist.m3u8`, // m3u8 파일 URL
      playbackRateControls: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
      autostart: false,
      width: '720px',
      height: '450px',
      volume: Number(this.volumeSlider.value),
    });

    this.player.on('ready', function() {
      this.player.seek(startTime);
      this.player.play(true);
      this.startTimer();
      this.gameFrameId = requestAnimationFrame(this.loopGame.bind(this));
    }.bind(this));

    this.player.on('time', (event) => {
      if (event.position >= endTime) {
        this.player.pause(true);
      }
    });
  }

  startGame() {
    if (DEV) console.log('게임 시작');
    if (!this.gameSong) {
      alert('노래를 선택해주세요.');
      return;
    }
    this.gameRunning = true;
    this.menu.style.display = 'none';
    this.songSelection.style.display = 'none';
    this.gameDIV.style.display = 'block';
    this.backdrop.style.display = 'none';
    this.gamePopup.style.display = 'none';

    if (this.gameSong.song.isPlayable) {
      this.gameEndTime = this.gameSong.song.endTime - this.gameSong.song.startTime + 5; // 기본적으로 5초 추가
      this.initPlayer(this.gameSong.song.url, this.gameSong.startTime || 0, this.gameSong.endTime || 4*60);
    } else {
      this.gameEndTime = this.gameSong.song.endTime + 5; // 기본적으로 5초 추가
      this.startTimer();
      this.gameFrameId = requestAnimationFrame(this.loopGame.bind(this));
    }
  }

  endGame() {
    this.gameRunning = false;
    if (this.gameTimerInterval !== null) clearInterval(this.gameTimerInterval);
    if (this.gameFrameId !== null) cancelAnimationFrame(this.gameFrameId);
    this.gameDIV.style.display = 'none';
    this.backdrop.style.display = 'block';
    this.gamePopup.style.display = 'block';
    this.popupTitle.textContent = '게임 종료';
    this.popupScore.textContent = `Perfect: ${this.perfectCount} | Great: ${this.greatCount} | Bad: ${this.badCount} | Miss: ${this.missCount}`;
    if (this.player) this.player.pause(true);
    if (this.gameSong.name === 'correction') {
      this.correctionValue = this.correctionList.length > 0 ? Math.round(this.correctionList.reduce((s, n) => s+n, 0) / this.correctionList.length) : 0;
      this.popupTitle.textContent = '보정 완료';
      this.popupScore.textContent = `보정값: ${this.correctionValue}ms`;
      this.correctionElement.textContent = `보정값: ${this.correctionValue}ms`;
      window.localStorage.setItem('correction', this.correctionValue.toString());
      if (DEV) console.log('보정값:', this.correctionValue+'ms');
    }
    if (this.gameSong.name === 'makeNote') {
      this.popupTitle.textContent = '유저 노트 생성 완료';
      this.popupScore.textContent = `생성된 노트: ${this.makeCharts.length}개`;
      if (DEV) console.log('유저 노트 저장');
      if (DEV) console.log(this.makeCharts.map(n => `\n  { time: ${n.time}, lane: ${n.lane} },`).join(''));
    }
  }

  loopGame() {
    if (!this.gameRunning || this.gameFrameId === null) return;
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.drawLanes();
    for (let i=0; i<this.noteSpeed; i++) {
      this.drawNotes();
      this.drawHitLine();
      this.drawFeedback();
      for (let j=0; j<4; j++) {
        this.drawLaneEffect(j);
        this.drawHitEffect(j);
        this.drawKeyboard(j);
      }

      // 롱노트 누르고있을때
      this.notes.forEach(function(note, index) {
        if (note.type === 'start' && note.isActive) this.processHold(note, index);
      }.bind(this));
    }

    this.gameFeedbackCounts.textContent = `Perfect: ${this.perfectCount} | Great: ${this.greatCount} | Bad: ${this.badCount} | Miss: ${this.missCount}`;
    
    this.gameFrameId = requestAnimationFrame(this.loopGame.bind(this));
  }

  startTimer() {
    this.gameTimer.style.display = 'block';
    this.gameTime = 0.00;
    this.gameTimer.textContent = `시간: ${formatTime(this.gameTime)} | 총 시간: ${formatTime(this.gameEndTime)}`;
    
    setTimeout(function() {
      if (!this.gameRunning) return;
      this.spawnNotes.call(this);
      this.gameTimerInterval = setInterval(this.loopTimer.bind(this), 10);
    }.bind(this), 1000); // 1초 후에 노트 생성 시작
  }

  loopTimer() {
    if (!this.gameRunning) return;
    this.gameTime += 0.01;
    this.gameTimer.textContent = `시간: ${formatTime(this.gameTime)} | 총 시간: ${formatTime(this.gameEndTime)}`;
    if (this.gameTime >= this.gameEndTime) this.endGame();
  }

  spawnNotes() {
    for (let index in this.gameSong.chart) {
      if (!this.gameRunning) break;
      const note = this.gameSong.chart[index];
      if (!this.spawnTimeoutList[index]) this.spawnTimeoutList[index] = null;
      this.spawnTimeoutList[index] = setTimeout(function() {
        if (!this.gameRunning) return;
        this.notes.push({
          id: index,
          lane: note.lane,
          y: -100,
          type: 'start',
          time: note.time,
          endTime: note.endTime || null, // 롱노트 여부 확인
          isActive: false, // 롱노트 활성화 여부
          holdScore: '', // 롱노트 점수
        });
        if (!note.endTime) return;
        this.spawnTimeoutList[index] = setTimeout(function() {
          if (!this.gameRunning) return;
          this.notes.push({
            id: index,
            lane: note.lane,
            y: -100,
            type: 'end',
            time: note.endTime,
            endTime: note.endTime,
            isActive: false,
            holdScore: '',
          });
        }.bind(this), note.endTime - note.time);
      }.bind(this), note.time);
    }
  }

  drawHitLine() {
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(0, this.hitLineY-3, this.canvasWidth, 6);
  }

  drawLanes() {
    for (let i=0; i<4; i++) {
      this.ctx.fillStyle = i%2===0 ? '#ddd' : '#ccc';
      this.ctx.fillRect(i*this.laneWidth, 0, this.laneWidth, this.canvasHeight);
    }
  }

  drawKeyboard(lane) {
    const isActive = this.activeKeys.has(lane);
    this.ctx.fillStyle = isActive ? '#ff0000' : '#222'; // 빨간색, 어두운 회색
    this.ctx.fillRect(lane*this.laneWidth, this.keyboardY, this.laneWidth, this.keyboardHeight);

    // 테두리
    this.ctx.strokeStyle = '#444'; // 어두운 회색
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(lane*this.laneWidth, this.keyboardY, this.laneWidth, this.keyboardHeight);

    // 눌렀을때
    if (!isActive) return;
    const gradient = this.ctx.createLinearGradient(
      lane*this.laneWidth,
      this.keyboardY,
      lane*this.laneWidth,
      this.keyboardY+this.keyboardHeight
    );
    gradient.addColorStop(0, 'rgba(255, 100, 100, 0.8'); // 밝은 빨간색
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0.2'); // 어두운 빨간색
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(lane*this.laneWidth, this.keyboardY, this.laneWidth, this.keyboardHeight);
  }

  drawNotes() {
    this.notes.forEach((note, index) => {
      note.y += 1;
      const noteX = note.lane * this.laneWidth + 10;
      const addY = -this.correctionValue;

      if (note.endTime && note.type === 'start') { // 롱노트 시작 노트
        const startY = note.isActive ? this.hitLineY : note.y;
        const endNoteIndex = this.notes.findIndex(n => n.lane === note.lane && n.type === 'end' && n.time === note.endTime);
        const endY = endNoteIndex === -1 ? -100 : this.notes[endNoteIndex].y;

        // 연결막대
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(noteX, startY-this.noteHeight/2-1+addY, this.noteWidth, endY-startY+this.noteHeight/2+1);
        // 시작 노트
        this.ctx.fillStyle = '#00cc00';
        this.ctx.fillRect(noteX, startY-this.noteHeight/2+addY, this.noteWidth, this.noteHeight);

        // 롱노트가 화면을 벗어나면 Miss 처리
        if (endY > this.canvasHeight) {
          this.notes.splice(index, 1);
          this.notes.splice(endNoteIndex, 1);
          this.missCount++;
          this.showFeedback('Miss');
        }
      } else if (note.endTime && note.type === 'end') { // 롱노트 끝 노트
        this.ctx.fillStyle = '#00cc00';
        this.ctx.fillRect(noteX, note.y-this.noteHeight/2+addY, this.noteWidth, this.noteHeight);
      } else { // 일반 노트
        this.ctx.fillStyle = '#007bff';
        this.ctx.fillRect(noteX, note.y-this.noteHeight/2+addY, this.noteWidth, this.noteHeight);

        // 노트가 화면을 벗어나면 Miss 처리
        if (note.y > this.canvasHeight) {
          this.notes.splice(index, 1);
          this.missCount++;
          this.showFeedback('Miss');
        }
      }
    });
  }

  drawHitEffect(lane) {
    const effectTime = this.hitEffects[lane];
    if (effectTime && Date.now() - effectTime < this.effectDuration) {
      const t = (Date.now() - effectTime) / this.effectDuration;
      const scale = 1 + 1.5 * t; // 더 크게 퍼지도록 조정
      const x = lane * this.laneWidth + this.laneWidth / 2;
      const y = this.hitLineY + 2;
      this.ctx.save();
      this.ctx.globalAlpha = this.effectTransparentcy * (1 - t); // 점점 투명하게
      this.ctx.beginPath();
      this.ctx.arc(x, y, this.effectSize * scale, 0, 2 * Math.PI);
      this.ctx.lineWidth = 5 * (1 - t) + 2; // 점점 얇아지게
      this.ctx.strokeStyle = '#fff';
      this.ctx.shadowColor = '#fff';
      this.ctx.shadowBlur = 10 * (1 - t);
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  drawLaneEffect(lane) {
    if (!this.activeKeys.has(lane)) return;
    // 효과가 천천히 밝아지도록 시간 기록
    if (!this.laneEffects[lane]) this.laneEffects[lane] = Date.now();
    const elapsed = Math.min((Date.now() - this.laneEffects[lane])/100, 1);

    const x = lane * this.laneWidth;
    const width = this.laneWidth;
    const maxHeight = this.keyboardY;
    const effectHeight = maxHeight * 0.8; // 빛의 범위(조절 가능)
    const y = this.keyboardY - effectHeight;
    // 그라데이션 생성 (아래에서 위로)
    const gradient = this.ctx.createLinearGradient(
      x, this.keyboardY, x, y
    );
    const color = '255,150,150';
    gradient.addColorStop(0, `rgba(${color},${0.3*elapsed})`);
    gradient.addColorStop(0.7, `rgba(${color},${0.15*elapsed})`);
    gradient.addColorStop(1, `rgba(${color},0)`);

    this.ctx.save();
    this.ctx.globalAlpha = this.effectTransparentcy * 2; // 좀 더 밝게
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y, width, effectHeight);
    this.ctx.restore();
  }

  drawFeedback() {
    if (this.feedbackText) {
      this.ctx.font = '30px Arial';
      this.ctx.fillStyle = '#000';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.feedbackText, this.canvasWidth/2, this.hitLineY-50);
    }
  }

  showFeedback(text) {
    this.feedbackText = text;
    clearTimeout(this.feedbackTimeout);
    this.feedbackTimeout = setTimeout(function() {
      this.feedbackText = '';
    }.bind(this), this.feedbackDuration);
  }

  eventKeydown(event) {
    if (!this.gameRunning) return;
    const lane = this.keys.indexOf(event.key);
    if (lane === -1 || this.activeKeys.has(lane)) return;

    this.activeKeys.add(lane);

    if (this.gameSong.name === 'makeNote') { // 유저 노트 생성 모드
      this.makeCharts.push({ time: Math.floor(this.gameTime*1000), lane: lane });
      if (DEV) console.log('노트 생성:', this.makeCharts[this.makeCharts.length-1]);
    }

    const noteIndex = this.notes.findIndex(note => note.lane === lane);
    if (noteIndex === -1) return;
    const note = this.notes[noteIndex];
    const distance = Math.abs(note.y-this.hitLineY);

    if (this.gameSong.name === 'correction') { // 보정 모드
      this.correctionList.push(note.y-this.hitLineY);
      if (DEV) console.log(note.id, note.time, note.y-this.hitLineY);
    }

    this.processHit(note, noteIndex, distance);
  }

  eventKeyup(event) {
    if (!this.gameRunning) return;
    const lane = this.keys.indexOf(event.key);
    if (lane === -1) return;
    this.activeKeys.delete(lane);
    this.laneEffects[lane] = null; // 이펙트 초기화
    if (this.gameSong.name === 'correction') return; // 보정 모드
    const noteIndex = this.notes.findIndex(note => note.lane === lane);
    if (noteIndex === -1) return;
    const note = this.notes[noteIndex];
    const distance = Math.abs(note.y-this.hitLineY);
    this.processUp(note, noteIndex, distance);
  }

  processHit(note, index, distance) {
    if (note.endTime && note.type === 'start') { // 롱노트 처리
      const endNoteIndex = this.notes.findIndex(n => n.lane === note.lane && n.type === 'end' && n.time === note.endTime);
      if (distance <= this.perfectDistance && !note.isActive) {
        note.isActive = true;
        note.holdScore = 'perfect';
        this.perfectCount++;
        this.showFeedback('Perfect');
      } else if (distance <= this.greatDistance && !note.isActive) {
        note.isActive = true;
        note.holdScore = 'great';
        this.greatCount++;
        this.showFeedback('Great');
      } else if (distance <= this.badDistance && !note.isActive) {
        note.isActive = true;
        note.holdScore = 'bad';
        this.badCount++;
        this.showFeedback('Bad');
      } else if (distance > this.badDistance && note.isActive) {
        this.notes.splice(index, 1);
        this.notes.splice(endNoteIndex, 1);
        this.missCount++;
        this.showFeedback('Miss');
      }
    } else { // 일반 노트 처리
      if (distance <= this.perfectDistance) {
        this.notes.splice(index, 1);
        this.perfectCount++;
        this.showFeedback('Perfect');
      } else if (distance <= this.greatDistance) {
        this.notes.splice(index, 1);
        this.greatCount++;
        this.showFeedback('Great');
      } else if (distance <= this.badDistance) {
        this.notes.splice(index, 1);
        this.badCount++;
        this.showFeedback('Bad');
      } else if (distance <= this.missDistance) {
        this.notes.splice(index, 1);
        this.missCount++;
        this.showFeedback('Miss');
      }
    }
    this.hitEffects[note.lane] = Date.now();
  }

  processUp(note, index, distance) {
    if (!(note.endTime && note.isActive && note.type === 'start')) return;
    const endNoteIndex = this.notes.findIndex(n => n.lane === note.lane && n.type === 'end' && n.time === note.endTime);
    if (endNoteIndex === -1) return;
    this.notes.splice(index, 1);
    this.notes.splice(endNoteIndex, 1);
    if (distance <= this.perfectDistance) {
      this.perfectCount++;
      this.showFeedback('Perfect');
    } else if (distance <= this.greatDistance) {
      this.greatCount++;
      this.showFeedback('Great');
    } else if (distance <= this.badDistance) {
      this.badCount++;
      this.showFeedback('Bad');
    } else if (distance > this.badDistance) {
      this.missCount++;
      this.showFeedback('Miss');
    }
  }

  processHold(note, index) {
    const endNoteIndex = this.notes.findIndex(n => n.lane === note.lane && n.type === 'end' && n.time === note.endTime);
    if (endNoteIndex === -1) return;
    const endNote = this.notes[endNoteIndex];
    if (endNote.y-this.hitLineY > this.badDistance) { // 롱노트가 화면을 벗어나면 Miss 처리
      this.notes.splice(index, 1);
      this.notes.splice(endNoteIndex, 1);
      this.missCount++;
      this.showFeedback('Miss');
    } else {
      if (note.holdScore === 'perfect') {
        this.perfectCount++;
        this.showFeedback('Perfect');
      }
      else if (note.holdScore === 'great') {
        this.greatCount++;
        this.showFeedback('Great');
      } else if (note.holdScore === 'bad') {
        this.badCount++;
        this.showFeedback('Bad');
      }
    }
  }
}

const game = new GameClass();