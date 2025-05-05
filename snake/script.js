// 타입 정의
// xy 오브젝트 타입 정의
/**
 * @typedef {Object} Object.XY {x,y}
 * @property {Number} x x
 * @property {Number} y y
 */

// 방향 타입 정의
/**
 * @typedef {'UP'|'DOWN'|'LEFT'|'RIGHT'|'OTHER'} Direction 방향타입
 */

// 수정가능한변수 한글이름 정의
/**
 * @typedef {'시간'|'레벨업점수'|'레벨업시간'|'칸수'} AditVarKo 수정가능한변수
 */

/**
 * 타입 확인
 * @param {any} val val
 * @returns {'Number'|'Boolean'|'String'|'Null'} return
 */
function checkType(val) {
  if (typeof(val) === Number) return 'Number';
  if (typeof(val) === Boolean) return 'Boolean';
  if (typeof(val) !== String) return 'Null';
  if (!isNaN(Number(val))) return 'Number';
  if (['true','false'].includes(val.trim().toLocaleLowerCase())) return 'Boolean';
  return 'String';
}

// 메인 클래스
class GameClass {
  // 직접 설정가능한 변수
  /** @type {Number} */
  #defSec = 0.33333; // 몇초마다 움직일지
  /** @type {Number} */
  #addSecScore = 5; // 몇점일때 추가할지
  /** @type {Number} */
  #addSec = 0.025; // 몇초 빠르게할지
  /** @type {Number} */
  #maxSize = 10; // 총 칸수

  // 게임 변수 초기화
  /** @type {Number} */
  #gameSec = this.#defSec; // 현재 움직이는 시간
  /** @type {Number} */
  #snakeSize = 0; // 스네이크 한 칸의 크기
  /** @type {Array<Object.XY>} */
  #snake = [{ x: 0, y: 0 }]; // 스네이크 초기 위치
  /** @type {Direction} */
  #direction = 'OTHER'; // 초기 이동 방향
  /** @type {Object.XY} */
  #food = { x: 0, y: 0 }; // 초기 음식 위치
  /** @type {Number} */
  #score = 0; // 초기 점수
  /** @type {Boolean} */
  #changeDirectionOnce = false; // 한번에 한방향으로 움직이는지
  /** @type {Boolean} */
  #gameClear = false; // 게임 성공 상태
  /** @type {Boolean} */
  #gameStop = false; // 게임 일시정지 상태
  /** @type {Boolean} */
  #gameOver = false; // 게임 오버 상태
  /** @type {Number | null} */
  #gameCode; // 게임 번호
  /** @type {Number} */
  #gameTimeStamp = -1; // 게임 반복문 시간
  /** @type {Number} */
  #gameTimeCount = 0; // 게임 반복문 횟수

  // 캔버스와 컨텍스트 초기화
  /** @type {HTMLCanvasElement} */
  #canvas = document.getElementById('gameCanvas');
  /** @type {CanvasRenderingContext2D} */
  #ctx = this.#canvas.getContext('2d');

  // 가져오기
  /** @type {HTMLDivElement} */
  #menuDIV = document.getElementById('menu');
  /** @type {HTMLDivElement} */
  #gameDIV = document.getElementById('game');
  /** @type {HTMLDivElement} */
  #backdrop = document.getElementById('backdrop');
  /** @type {HTMLDivElement} */
  #popup = document.getElementById('popup');
  /** @type {HTMLParagraphElement} */
  #popup_title = document.getElementById('title');
  /** @type {HTMLParagraphElement} */
  #popup_score = document.getElementById('score');
  /** @type {HTMLButtonElement} */
  #retryButton = document.getElementById('retryButton');
  /** @type {HTMLButtonElement} */
  #startButton = document.getElementById('startButton');

  constructor() {
    // 초기설정
    this.#winResize();
    this.#init();

    // 이벤트 처리
    window.addEventListener('resize', this.#winResize.bind(this));
    document.addEventListener('keydown', this.#eventKeyDown.bind(this));
    this.#retryButton.addEventListener('click', this.#init.bind(this));
    this.#startButton.addEventListener('click', this.#gameStart.bind(this));
  }

  // 창크기가 변경될때
  #winResize() {
    if (window.innerWidth > window.innerHeight) {
      this.#canvas.width = Math.floor(window.innerHeight/100*8)*10;
      this.#canvas.height = this.#canvas.width;
    } else {
      this.#canvas.width = Math.floor(window.innerWidth/100*8)*10;
      this.#canvas.height = this.#canvas.width;
    }
  }

  // 기본 설정
  #init() {
    this.#removeGame();

    // 변수 기본설정
    this.#gameStop = false;
    this.#gameClear = false;
    this.#gameOver = false;
    this.#direction = 'OTHER';
    this.#score = 0;
    this.#gameSec = this.#defSec;
    
    // 스네이크 기본설정
    this.#snakeSize = this.#canvas.width/this.#maxSize;
    this.#snake = [{
      x: this.#canvas.width/2-this.#snakeSize,
      y: this.#canvas.width/2-this.#snakeSize
    }];

    // 음식 기본설정
    this.#food = this.#makeFood();
    
    // css 기본설정
    this.#menuDIV.style.display = 'inline';
    this.#gameDIV.style.display = 'none';
    this.#backdrop.style.display = 'none';
    this.#popup.style.display = 'none';
  }

  // 게임 시작
  #gameStart() {
    if (this.#gameCode !== null) return;
    this.#menuDIV.style.display = 'none';
    this.#gameDIV.style.display = 'inline';
    this.#backdrop.style.display = 'none';
    this.#popup.style.display = 'none';
    this.#gameCode = window.requestAnimationFrame(this.#gameLoop.bind(this));
  }

  /**
   * 게임중
   * @param {DOMHighResTimeStamp} time requestAnimationFrame의 기본 제공 변수
   */
  #gameLoop(timeStamp) {
    if (this.#gameClear || this.#gameStop || this.#gameOver) {
      this.#removeGame();
      return;
    }
    // 초기값 설정
    if (this.#gameTimeStamp < 0) this.#gameTimeStamp = timeStamp;

    // 시간 설정
    let duration = timeStamp - this.#gameTimeStamp;
    this.#gameTimeStamp = timeStamp;

    // 횟수 +1
    this.#gameTimeCount += 1;

    // 프레임 차이가 16ms이상일때 (60fps)
    if (duration > 16.0) {
      this.#clearCanvas();
      this.#drawFood();

      // 설정한 초마다 실행
      if (this.#gameTimeCount >= 60*this.#gameSec) {
        this.#gameTimeCount = 0;
        this.#moveSnake();
      }

      this.#checkCrash();
      this.#drawSnake();
    }

    // 재귀 반복
    this.#gameCode = window.requestAnimationFrame(this.#gameLoop.bind(this));
  }

  // 게임 종료
  #gameEnd() {
    this.#removeGame();

    // 게임 성공시
    if (this.#gameClear) this.#popup_title.textContent = '축하합니다.';
    // 게임 실패시
    if (this.#gameOver) this.#popup_title.textContent = '게임 종료';
    // 게임 일시정지시
    if (this.#gameStop) {
      this.#popup_title.textContent = '일시정지됨';
      this.#popup_score.textContent = '';
    } else {
      this.#popup_score.textContent = `점수: ${this.#score}점`;
    }

    // popup 화면에 표시하기
    this.#backdrop.style.display = 'block';
    this.#popup.style.display = 'block';
  }

  // 반복 지우기
  #removeGame() {
    if (this.#gameCode !== null) window.cancelAnimationFrame(this.#gameCode);
    this.#gameCode = null;
  }

  // 캔버스 지우기
  #clearCanvas() {
    this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
  }

  // 음식 그리기
  #drawFood() {
    this.#ctx.fillStyle = 'red';
    this.#ctx.fillRect(this.#food.x, this.#food.y, this.#snakeSize, this.#snakeSize);
  }

  /**
   * 음식 생성
   * @returns {Object.XY}
   */
  #makeFood() {
    const x = Math.floor(Math.random() * this.#maxSize) * this.#snakeSize;
    const y = Math.floor(Math.random() * this.#maxSize) * this.#snakeSize;

    // 음식이 스네이크와 겹치지 않도록 확인
    if (this.#snake.some(v => v.x === x && v.y === y)) return this.#makeFood();
    return { x, y };
  }

  // 스네이크 그리기
  #drawSnake() {
    this.#ctx.fillStyle = 'green';
    this.#snake.forEach(v => {
      this.#ctx.fillRect(v.x, v.y, this.#snakeSize, this.#snakeSize);
    });
  }

  // 스네이크 이동
  #moveSnake() {
    const head = { ...this.#snake[0] };
    switch (this.#direction) {
      case 'UP':
        head.y -= this.#snakeSize;
        break;
      case 'DOWN':
        head.y += this.#snakeSize;
        break;
      case 'LEFT':
        head.x -= this.#snakeSize;
        break;
      case 'RIGHT':
        head.x += this.#snakeSize;
        break;
    }
    this.#snake.unshift(head);

    // 음식과 충돌 시
    if (head.x === this.#food.x && head.y === this.#food.y) {
      this.#score += 1;
      this.#food = this.#makeFood();

      // 속도 증가
      if (this.#score % this.#addSecScore === 0) this.#gameSec -= this.#addSec;
    } else {
      this.#snake.pop();
    }
    this.#changeDirectionOnce = false;
  }

  // 충돌 검사
  #checkCrash() {
    const head = this.#snake[0];

    // 벽과 충돌시
    if (
      head.x < 0
      || head.x >= this.#canvas.width
      || head.y < 0
      || head.y >= this.#canvas.height
    ) {
      this.#gameOver = true;
      this.#gameEnd();
      return;
    }

    // 자기 자신과 충돌 시
    for (let i=1; i<this.#snake.length; i++) {
      if (head.x === this.#snake[i].x && head.y === this.#snake[i].y) {
        this.#gameOver = true;
        this.#gameEnd();
        break;
      }
    }
  }

  /**
   * 키보드를 눌렀을때
   * @param {KeyboardEvent} e keydown
   */
  #eventKeyDown(e) {
    const key = e.key;
    if (key === 'Escape' || key === 'p') {
      if (this.#gameClear || this.#gameOver) return;
      this.#gameStop = !this.#gameStop;
      if (!this.#gameStop) {
        this.#backdrop.style.display = 'none';
        this.#popup.style.display = 'none';
        this.#gameStart();
      }
      return;
    }

    // 게임중이 아닐때
    if (this.#gameCode === null) return;

    /** @type {Direction} */
    const newDirection = key === 'ArrowUp' ? 'UP'
      : key === 'ArrowDown' ? 'DOWN'
      : key === 'ArrowLeft' ? 'LEFT'
      : key === 'ArrowRight' ? 'RIGHT'
      : 'OTHER';

    // 다른키를 눌렀을때
    if (newDirection === 'OTHER') return;

    // 같은 방향으로 이동하려할때
    if (newDirection === this.#direction) return;

    // 바로 반대방향으로 이동하려할때
    if (
      newDirection === 'UP' && this.#direction === 'DOWN'
      || newDirection === 'DOWN' && this.#direction === 'UP'
      || newDirection === 'LEFT' && this.#direction === 'RIGHT'
      || newDirection === 'RIGHT' && this.#direction === 'LEFT'
    ) return;

    // 방향변경을 한적 없을때
    if (!this.#changeDirectionOnce) {
      this.#direction = newDirection;
      this.#changeDirectionOnce = true;
    }
  }

  /**
   * 유저용 데이터관련
   * @returns {Object<AditVarKo, Object<String, any>>} obj반환
   */
  #backData() {
    return {
      시간: {
        data: this.#defSec,
        des: "캐릭터 한칸이동을 몇초마다 할것인지 설정",
      },
      레벨업점수: {
        data: this.#addSecScore,
        des: "몇점마다 레벨업을할지 설정",
      },
      레벨업시간: {
        data: this.#addSec,
        des: "레벨업할때마다 몇초씩 빨라질지 설정",
      },
      칸수: {
        data: this.#maxSize,
        des: "게임을 가로세로 몇칸으로 할지 설정",
      },
    };
  }

  // 퍼블릭
  data = {
    getAll: () => {
      const data = this.#backData();
      /** @type {AditVarKo} */
      let nameList = Object.keys(data);
      console.log(nameList.map(v => `${v} : ${data[v].data}\n - ${data[v].des}`).join('\n'));
    },
    /**
     * @param {AditVarKo} key aditvarko
     */
    get: (key) => {
      const dataValList = Object.keys(this.#backData());
      if (!key || !key.trim()) return console.error(`error: 가져올 변수이름을 하나는 입력해야합니다.\n목록: ${dataValList.join(', ')}`);
      if (!dataValList.includes(key)) return console.error(`error: ${key} 변수이름을 찾을수없습니다.\n목록: ${dataValList.join(', ')}`);
      return this.#backData()[key].data;
    },
    /**
     * @param {AditVarKo} key aditvarko
     * @param {any} value any
     */
    set: (key, value) => {
      const dataValList = Object.keys(this.#backData());
      if (!key || !key.trim()) return console.error(`error: 수정할 변수이름을 하나는 입력해야합니다.\n목록: ${dataValList.join(', ')}`);
      if (!dataValList.includes(key)) return console.error(`error: ${key} 변수이름을 찾을수없습니다.\n목록: ${dataValList.join(', ')}`);
      if (!value) return console.error(`error: 수정할 값을 찾을수없습니다.\n목록: ${dataValList.join(', ')}`);
      if (checkType(value) !== checkType(this.#backData()[key].data)) return console.error(`error: ${key}변수타입과 ${value}변수타입이 맞지않습니다.\n올바른타입: ${checkType(this.#backData()[key].data)}`);
      var check = false;
      try {
        if (key === "시간") {
          this.#defSec = Number(value);
          check = true;
        }
        if (key === "레벨업점수") {
          this.#addSecScore = Number(value);
          check = true;
        }
        if (key === "레벨업시간") {
          this.#addSec = Number(value);
          check = true;
        }
        if (key === "칸수") {
          this.#maxSize = Number(value);
          check = true;
        }
      } catch (err) {
        return console.error(`error: 수정할수가없습니다. ${err}`);
      }
      if (!check) return console.error(`error: 수정할수가없습니다. null`);
      return console.log(`${key} 수정완료: ${value}`);
    }
  }
}

const game = new GameClass();
