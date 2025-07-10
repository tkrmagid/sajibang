/**
 * // 플레이어 관련
 * @typedef {"bot"|"human"} Player.Type 플레이어 타입
 **/
/**
 * @typedef {Object} Player 플레이어
 * @property {Player.Type} type 타입
 * @property {{ suit: Card.Suit; rank: Card.Rank; }[]} hand 손패
 * @property {number} money 돈
 * @property {boolean} first 첫번째인지
 * @property {{ bet: number; check: boolean; fold: boolean; }} game 게임 관련
 */
/**
 * // 카드 관련
 * @typedef {'♠'|'♥'|'♦'|'♣'} Card.Suit 모양
 * @typedef {'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'|'A'} Card.Rank 숫자
 * @typedef {"red"|"black"} Card.Color 색깔
 */
/**
 * // 베팅관련
 * @typedef {"raise"|"call"|"check"|"fold"|"skip"} Bet.Action 엑션
 */

// 최대 플레이어
const max_players = 4;


// 도구 함수들
/**
 * min~max 정수 랜덤
 * @param {number} min 최소값
 * @param {number} max 최대값
 * @returns {number} 정수 랜덤값
 */
function random(min, max) {
  if (min > max) throw new Error("random오류: min은 max보다 작거나 같아야 합니다.");
  const range = max - min + 1;
  const maxUint32 = 2 ** 32;
  const maxAcceptable = Math.floor(maxUint32 / range) * range;
  let randomUnit32;
  const buffer = new Uint32Array(1);
  // 편향을 제거하기 위해 범위 초과 값은 버림
  do {
    crypto.getRandomValues(buffer);
    randomUnit32 = buffer[0];
  } while (randomUnit32 >= maxAcceptable);

  return min + (randomUnit32 % range);
}

/**
 * 리스트 셔플
 * @param {any[]} arr 섞을 리스트
 * @returns {any[]} 섞인 리스트
 */
function shuffle(arr) {
  const result = [...arr];
  for (let i=result.length-1; i>0; i--) {
    const j = this.random(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}


// 실행
document.addEventListener("DOMContentLoaded", () => {
  window.game = new GameClass();
});


// 게임 관련 내용
class GameClass {
  // 불러오기
  #gameLogElement = document.getElementById("gameLog");
  #slotElements = document.querySelectorAll(".player-slot");
  #betButtons = document.querySelectorAll("button[data-action]");
  #raiseUI = document.getElementById("raiseUI");
  #raiseInput = document.getElementById("raiseMoney");
  #raiseConfirmBtn = document.getElementById("raiseConfirm");
  #communityCardsElements = document.getElementById("communityCards");

  /** @type {Player[]} 플레이어 목록 */
  players = [];
  /** @type {number} 처음 플레이어 */
  firstPlayerIndex = -1;
  /** @type {number} 현재 플레이어 */
  nowPlayerIndex = -1;
  /** @type {number} 시작 금액 */
  startingMoney = -1;
  /** @type {string[]} 카드 전체 덱 */
  deck = [];
  /** @type {string[]} 커뮤니티 카드 */
  communityCards = [];
  /** @type {number} 현재 배팅 금액 */
  currentBet = 0;
  /** @type {number[]} 타임아웃 리스트 */
  setTimeoutList = [];

  /**
   * class new로 생성할때 자동 실행
   */
  constructor() {
    this.menuClass = new MenuClass(this);
    this.cardClass = new CardClass();

    this.#betButtons.forEach(btn => btn.addEventListener("click", (e) => {
      if (this.nowPlayerIndex === -1) return;
      /** @type {Bet.Action} */
      const action = e.currentTarget.dataset.action;
      if (action !== "raise") return this.betAction(action);

      // 레이즈 일때
      if (this.#raiseUI.classList.contains("hidden")) {
        this.#raiseInput.min = Math.ceil(this.currentBet*1.5);
        this.#raiseInput.max = this.players[this.nowPlayerIndex].money;
        this.#raiseInput.value = this.#raiseInput.min;
        this.#raiseUI.classList.remove("hidden");
      } else {
        this.#raiseUI.classList.add("hidden");
      }
    }));

    this.#raiseConfirmBtn.addEventListener("click", () => {
      this.#raiseUI.classList.add("hidden");
      this.betAction("raise");
    });
  }

  /**
   * 화면에 메세지 출력
   * @param {string} info 정보 ex: 게임시작, 플레이어1 등
   * @param {string} msg 메세지 내용
   */
  log(info, msg) {
    const log = document.createElement("div");
    const timestamp = new Date().toLocaleTimeString();
    log.textContent = `[${timestamp}] [${info}] ${msg}`;
    this.#gameLogElement.appendChild(log);
    this.#gameLogElement.scrollTop = this.#gameLogElement.scrollHeight;
  }

  /**
   * 초기화
   */
  clear() {
    this.#slotElements.forEach((slot) => {
      slot.classList.remove("fold");
      slot.classList.remove("turn");
    });
    this.#betButtons.forEach(btn => btn.disabled = false);
    this.#gameLogElement.innerHTML = "";
    this.mainMenu.classList.remove("hidden");
    this.gameScreen.classList.add("hidden");
    this.#raiseUI.classList.remove("hidden");
    this.communityCards = [];
    this.setTimeoutList.forEach(id => {
      clearTimeout(id);
      this.setTimeoutList.splice(this.setTimeoutList.indexOf(id), 1);
    });
  }

  /**
   * 콜,체크 변경
   * @param {Player} player 플레이어
   */
  changeCallCheck(player) {
    const btn = Array.from(this.#betButtons.values()).find(btn => btn.dataset.action === "call" || btn.dataset.action === "check");
    if (this.currentBet > player.game.bet) {
      btn.dataset.action = "call";
      btn.textContent = "콜";
    } else {
      btn.dataset.action = "check";
      btn.textContent = "체크";
    }
  }

  /**
   * 게임 시작전 설정
   */
  init() {
    this.log("알림", "게임시작");

    // 덱 섞기
    this.deck = shuffle(Array.from(this.cardClass.cards.keys()));

    // 카드 나누기
    for (let i=0; i<this.players.length; i++) {
      const card1 = Array.from(this.deck.pop());
      const card2 = Array.from(this.deck.pop());
      this.players[i].hand = [
        { suit: card1[0], rank: card1[2] ? 10 : card1[1] },
        { suit: card2[0], rank: card2[2] ? 10 : card2[1] },
      ];
    }

    // 게임화면에 플레이어 표시
    this.#slotElements.forEach((slot, i) => {
      const player = this.players[i];
      if (!player) {
        slot.classList.add("hidden");
      } else {
        slot.classList.remove("hidden");
        slot.innerHTML = `
          <div><strong>플레이어 ${i+1} (${player.type === "bot" ? "로봇" : "사람"})</strong></div>
          <div id="money">${player.money.toLocaleString()}원</div>
          <div id="temp">
            <!-- ${ player.first ? `(SB)` : this.players[i-1]?.first ? `(BB)` : "" } -->
          </div>
        `;

        // 개인 카드 가져오기 (뒷면으로)
        const cardsDIV = document.createElement("div");
        cardsDIV.id = "playerCards";
        for (let i=0; i<2; i++) {
          const cardDIV = document.createElement("div");
          cardDIV.className = "card";
          cardDIV.id = `card${i+1}`;
          const backDIV = document.createElement("div");
          backDIV.className = "card-face card-back";
          backDIV.appendChild(this.cardClass.cardBack);
          cardDIV.appendChild(backDIV);
          const frontDIV = document.createElement("div");
          frontDIV.className = "card-face card-front";
          frontDIV.appendChild(this.cardClass.cards.get(
            player.hand[i].suit+player.hand[i].rank
          ));
          cardDIV.appendChild(frontDIV);
          cardsDIV.appendChild(cardDIV);
        }
        slot.appendChild(cardsDIV);

        // 카드 오픈 버튼
        if (player.type === "bot") return;
        const handOpenBtn = document.createElement("button");
        handOpenBtn.id = "handOpen";
        handOpenBtn.textContent = "카드 확인하기";
        handOpenBtn.addEventListener("mousedown", () => {
        handOpenBtn.textContent = "카드가 공개되어있습니다!";
          handOpenBtn.classList.add("holding");
          for (let i=0; i<2; i++) cardsDIV.childNodes.forEach((card) => {
            card.classList.add("flip");
          });
        });
        handOpenBtn.addEventListener("mouseup", () => {
        handOpenBtn.textContent = "카드 확인하기";
          handOpenBtn.classList.remove("holding");
          for (let i=0; i<2; i++) cardsDIV.childNodes.forEach((card) => {
            card.classList.remove("flip");
          });
        });
        handOpenBtn.addEventListener("mouseleave", () => {
        handOpenBtn.textContent = "카드 확인하기";
          handOpenBtn.classList.remove("holding");
          for (let i=0; i<2; i++) cardsDIV.childNodes.forEach((card) => {
            card.classList.remove("flip");
          });
        });
        slot.appendChild(handOpenBtn);
      }
    });

    this.log("딜러", "플레이어들에게 카드 2장이 지급되었습니다.");

    // 베팅 시작
    this.currentBet = 0;
    const playerIndex = this.players.findIndex(p => p.first);
    if (playerIndex === -1) throw new Error("베팅할 플레이어를 찾을수 없습니다.");
    this.firstPlayerIndex = playerIndex;
    this.nowPlayerIndex = playerIndex;
    this.changeCallCheck(this.players[playerIndex]);
    this.#slotElements.item(playerIndex).querySelector("#temp").textContent = "베팅중...";
    this.#slotElements.item(playerIndex).classList.add("turn");
    this.log("딜러", `플레이어 ${playerIndex+1} 당신의 차례입니다.`);
  }

  /**
   * 베팅 버튼 클릭시
   * @param {Bet.Action} action 
   */
  betAction(action) {
    this.#slotElements.item(this.nowPlayerIndex).classList.remove("turn");
    const player = this.players[this.nowPlayerIndex];
    let temp = "";

    if (action === "fold") {
      player.game.fold = true;
      this.#slotElements.item(this.nowPlayerIndex).classList.remove("fold");
      temp = "폴드";
    } else if (action === "call") {
      const minus = this.currentBet - player.game.bet;
      player.money -= minus;
      player.game.bet = this.currentBet;
      player.game.check = true;
      temp = `콜 ${minus}원`;
    } else if (action === "check") {
      player.game.check = true;
      temp = "체크";
    } else if (action === "raise") {
      // 최소: 콜 금액 1.5배로 설정, 최대: 올인
      const raiseMoney = parseInt(this.#raiseInput.value);
      player.money -= raiseMoney;
      player.game.bet = raiseMoney;
      this.currentBet = raiseMoney;
      this.players.filter(p => !p.game.fold).forEach(p => p.game.check = false);
      temp = `레이즈 ${raiseMoney}원`;
    }

    if (action === "skip") {
      // 다음 라운드 (공유카드 공개 후)
      this.#betButtons.forEach(btn => btn.disabled = false);
    } else {
      // 공통처리
      const playerMoneyDIV = this.#slotElements.item(this.nowPlayerIndex).querySelector("#money");
      const playerTempDIV = this.#slotElements.item(this.nowPlayerIndex).querySelector("#temp");
      playerMoneyDIV.textContent = `${player.money}원`;
      playerTempDIV.textContent = temp;
      this.log(`플레이어 ${this.nowPlayerIndex+1}`, temp);
    }

    const nextPlayerIndex = this.getNextPlayerIndex();
    if (this.players.filter(p => !p.game.fold).length === 1) {
      // 혼자남음 종료할것
      // 테스트코드
      this.nowPlayerIndex = -1;
      const winPlayerIndex = this.players.findIndex(p => !p.game.fold);
      this.log("딜러", `플레이어 ${winPlayerIndex+1} 당신이 승리하셨습니다.`);
      return;
    }
    const nextPlayer = this.players[nextPlayerIndex];
    if (
      this.firstPlayerIndex === nextPlayerIndex
      && this.players[this.firstPlayerIndex].game.check
    ) {
      // 한바퀴 돌아서 다시 돌아옴
      // 테스트코드
      this.#slotElements.item(this.nowPlayerIndex).classList.remove("turn");
      this.#betButtons.forEach(btn => btn.disabled = true);
      this.currentBet = 0;
      this.players.filter(p => !p.game.fold).forEach(p => p.game.check = false);
      if (this.communityCards.length === 5) {
        // 비교하고 종료시켜야됨
        // 코드 추가할것
        return;
      }
      this.setCommunityCard();
      return;
    }
    // 아직 한바퀴 덜돔
    this.nowPlayerIndex = nextPlayerIndex;
    this.changeCallCheck(nextPlayer);
    this.#slotElements.item(nextPlayerIndex).querySelector("#temp").textContent = "베팅중...";
    this.#slotElements.item(nextPlayerIndex).classList.add("turn");
    this.log("딜러", `플레이어 ${nextPlayerIndex+1} 당신의 차례입니다.`);
  }

  /**
   * 커뮤니티 카드 가져오기
   */
  setCommunityCard() {
    let getNum = 1;
    if (this.communityCards.length === 0) getNum = 3;
    for (let i=0; i<getNum; i++) {
      const card = this.deck.pop();
      this.communityCards.push(card);
      const cardDIV = document.createElement("div");
      cardDIV.className = "card";
      cardDIV.id = `card${this.communityCards.length+i+1}`;
      const backDIV = document.createElement("div");
      backDIV.className = "card-face card-back";
      backDIV.appendChild(this.cardClass.cardBack);
      cardDIV.appendChild(backDIV);
      const frontDIV = document.createElement("div");
      frontDIV.className = "card-face card-front";
      frontDIV.appendChild(this.cardClass.cards.get(card));
      cardDIV.appendChild(frontDIV);
      this.#communityCardsElements.appendChild(cardDIV);
      this.setTimeoutList.push(setTimeout(function() {
        cardDIV.classList.add("flip");
        this.log("딜러", `공유카드 ${this.communityCards.length+i+1} : ${card}`);
      }.bind(this), (i+1)*1000));
    }
    this.log("딜러", `공유카드 ${getNum}장 공개`);
    this.setTimeoutList.push(setTimeout(function() {
      // 카드 공개후 함수
      this.betAction("skip");
    }.bind(this), (getNum+1)*1000));
  }

  /**
   * 다음 플레이어 인덱스 가져오기
   * @returns {number} 다음플레이어 인덱스
   */
  getNextPlayerIndex() {
    const len = this.players.length;
    let i = (this.nowPlayerIndex + 1) % len;
    while (i !== this.nowPlayerIndex) {
      if (!this.players[i].game.fold) return i;
      i = (i + 1) % len;
    }
    return this.nowPlayerIndex;
  }
}


// 메뉴 관련 내용
class MenuClass {
  // 불러오기
  mainMenu = document.getElementById("mainMenu");
  gameScreen = document.getElementById("gameScreen");
  playerList = document.getElementById("playerList");
  addPlayerBtn = document.getElementById("addPlayer");
  startGameBtn = document.getElementById("startGame");
  startingMoneyInput = document.getElementById("startingMoney");

  /**
   * class new로 생성할때 자동 실행
   * @param {GameClass} GameClass gameClass
   */
  constructor(GameClass) {
    this.gameClass = GameClass;
    this.gameClass.players = [
      // 플레이어1은 고정
      { type: "human", money: -1, hand: [], first: true, game: { bet: 0, check: false, fold: false } },
    ];
    this.render();

    this.addPlayerBtn.addEventListener("click", () => {
      if (this.gameClass.players.length >= max_players) return;
      this.gameClass.players.push({ type: "human", money: -1, hand: [], first: false, game: { bet: 0, check: false, fold: false } });
      this.render();
    });

    this.startGameBtn.addEventListener("click", () => {
      const startingMoney = parseInt(this.startingMoneyInput.value);
      this.gameClass.startingMoney = startingMoney;
      this.gameClass.players = this.gameClass.players.map(p => ({ ...p, money: startingMoney }));
      this.mainMenu.classList.add("hidden");
      this.gameScreen.classList.remove("hidden");
      this.gameClass.init();
    });
  }

  /**
   * 메뉴 화면 출력
   */
  render() {
    this.playerList.innerHTML = "";
    this.gameClass.players.forEach((p, i) => {
      const li = document.createElement("li");
      li.className = "player-item";
      li.dataset.index = i;

      const span = document.createElement("span");
      span.textContent = `플레이어 ${i+1} (${p.type === "bot" ? "로봇" : "사람"})`;
      li.appendChild(span);

      const select = document.createElement("select");
      // select.id = "playerType";
      select.name = "playerType";
      select.innerHTML = `
        <option value="human" ${p.type === "human" ? "selected" : ""}>사람</option>
        <option value="bot" ${p.type === "bot" ? "selected" : ""}>로봇</option>
      `;
      select.addEventListener("change", () => {
        this.gameClass.players[i].type = select.value === "human" ? "human" : "bot";
        this.render();
      });
      if (i !== 0) li.appendChild(select);

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "삭제";
      removeBtn.className = "remove-btn";
      removeBtn.onclick = () => {
        this.gameClass.players.splice(i, 1);
        this.render();
      }
      if (i !== 0) li.appendChild(removeBtn);

      this.playerList.appendChild(li);
    });
    if (this.gameClass.players.length >= max_players) {
      this.addPlayerBtn.disabled = true;
    } else if (this.gameClass.players.length >= 2) {
      this.addPlayerBtn.disabled = false;
      this.startGameBtn.disabled = false;
    } else {
      this.startGameBtn.disabled = true;
    }
  }
}


// 카드 관련 내용
class CardClass {
  /** @type {Card.Suit[]} */
  suits = ['♠','♥','♦','♣'];
  /** @type {Card.Rank[]} */
  ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  /** @type {number[][]} */
  pipPositions = {
  2: [[50,35,0],[50,35,1]],
  3: [[50,35,0],[50,75,0],[50,35,1]],
  4: [[30,35,0],[70,35,0],[30,35,1],[70,35,1]],
  5: [[30,35,0],[70,35,0],[50,75,0],[30,35,1],[70,35,1]],
  6: [[30,35,0],[70,35,0],[30,75,0],[70,75,0],[30,35,1],[70,35,1]],
  7: [[30,35,0],[70,35,0],[50,55,0],[30,75,0],[70,75,0],[30,35,1],[70,35,1]],
  8: [[30,35,0],[70,35,0],[30,60,0],[70,60,0],[30,60,1],[70,60,1],[30,35,1],[70,35,1]],
  9: [[30,35,0],[70,35,0],[30,60,0],[70,60,0],[50,75,0],[30,60,1],[70,60,1],[30,35,1],[70,35,1]],
  10: [[30,35,0],[70,35,0],[50,50,0],[30,60,0],[70,60,0],[30,60,1],[70,60,1],[50,50,1],[30,35,1],[70,35,1]],
  };
  /** @type {Map<string, SVGSVGElement>} */
  cards = new Map();
  /** @type {SVGSVGElement} */
  get cardBack() {
    return this.createCardBackSVG();
  }
  
  /**
   * class new로 생성할때 자동 실행
   */
  constructor() {
    for (const suit of this.suits) {
      for (const rank of this.ranks) {
        this.cards.set(suit+rank, this.createCardSVG(suit, rank));
      }
    }
  }

  /**
   * 색깔 가져오기
   * @param {Card.Suit} suit 모양
   * @returns {Card.Color} 색깔
   */
  color(suit) {
    return ['♥','♦'].includes(suit) ? "red" : "black";
  }

  /**
   * 카드 이미지 생성
   * @param {Card.Suit} suit 모양
   * @param {Card.Rank} rank 숫자
   * @returns {SVGSVGElement} svg 이미지
   */
  createCardSVG(suit, rank) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 140");
    svg.setAttribute("class", "poker-card");
    // svg.setAttribute("id", suit+rank);
    svg.setAttribute("width", "100");
    svg.setAttribute("height", "140");
    
    const fontFamily = "sans-serif";
    const color = this.color(suit);
    const positions = this.pipPositions[parseInt(rank)] || [[50, 70]];
    let pips = "";

    if (['J','Q','K','A'].includes(rank)) {
      pips += `<text x="50" y="90" font-size="70" text-anchor="middle" fill="${color}">${suit}</text>`;
    } else {
      for (const [x, y, r] of positions) {
        if (r === 1) pips += `<g transform="rotate(180, 50, 70)">`;
        pips += `<text x="${x}" y="${y+10}" font-size="45" text-anchor="middle" fill="${color}">${suit}</text>`;
        if (r === 1) pips += `</g>`;
      }
    }

    svg.innerHTML = `
      <!-- 외곽 테두리 -->
      <rect width="100" height="140" rx="10" ry="10" fill="white" stroke="black" stroke-width="2"/>
      <!-- 위쪽 모양, 숫자 -->
      <text x="${rank==="10"?"3":"5"}" y="${rank==="10"?"17":"20"}" font-size="${rank==="10"?"12":"16"}" font-family="${fontFamily}" font-weight="bold" fill="${color}">${rank}</text>
      <text x="4" y="${rank==="10"?"30":"33"}" font-size="12" font-family="${fontFamily}" fill="${color}">${suit}</text>
      
      <!-- 안쪽 모양 -->
      ${pips}
      
      <!-- 아래쪽 모양, 숫자 -->
      <g transform="rotate(180, 50, 70)">
        <text x="${rank==="10"?"3":"5"}" y="${rank==="10"?"17":"20"}" font-size="${rank==="10"?"12":"16"}" font-family="${fontFamily}" font-weight="bold" fill="${color}">${rank}</text>
        <text x="4" y="${rank==="10"?"30":"33"}" font-size="12" font-family="${fontFamily}" fill="${color}">${suit}</text>
      </g>
    `;
    return svg;
  }

  /**
   * 카드 뒷면 이미지 생성
   * @returns {SVGSVGElement} svg 이미지
   */
  createCardBackSVG() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 140");
    svg.setAttribute("class", "poker-card");
    // svg.setAttribute("id", "back");
    svg.setAttribute("width", "100");
    svg.setAttribute("height", "140");
    
    svg.innerHTML = `
      <!-- 외곽 테두리 -->
      <rect width="100" height="140" rx="10" ry="10" fill="white" stroke="black" stroke-width="2" />

      <!-- 내부 검정 배경 -->
      <rect x="6" y="6" width="88" height="128" fill="black" rx="6" ry="6" />

      <!-- 반복 패턴 배경 (격자무늬 느낌) -->
      <defs>
        <pattern id="grid" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M 6 0 L 0 0 0 6" fill="none" stroke="white" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect x="10" y="10" width="80" height="120" fill="url(#grid)" rx="4" ry="4" />

      <!-- 중앙 다이아몬드 모양 -->
      <rect x="39" y="60" width="25" height="20" transform="rotate(45 50 70)" fill="white" stroke="black" stroke-width="0.8"/>

      <!-- 중앙 별 -->
      <text x="50" y="75" font-size="12" fill="black" font-weight="bold" text-anchor="middle" font-family="serif">★</text>
    `;
    return svg;
  }
}