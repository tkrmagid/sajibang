/**
 * // 플레이어 관련
 * @typedef {"bot"|"human"} Player.Type 플레이어 타입
 * @typedef {"aggressive"|"passive"|"neutral"} Player.Personality 봇 성향
 **/
/**
 * @typedef {Object} Player 플레이어
 * @property {Player.Type} type 타입
 * @property {Player.Personality} personality 성향 (봇)
 * @property {Card.Hand[]} hand 손패
 * @property {number} money 돈
 * @property {boolean} first 첫번째인지
 * @property {{ bet: number; check: boolean; fold: boolean; history: Bet.Action[]; }} game 게임 관련
 */
/**
 * // 카드 관련
 * @typedef {{ rank: number; name: string; hand: Card.Value[]; kickers: any[]; }} Card.Evaluate 카드 족보 확인
 * @typedef {{ suit: Card.Suit; rank: Card.Rank; }} Card.Hand 손패
 * @typedef {{ suit: Card.Suit; rank: Card.Rank; value: number; }} Card.Value 손패(value포함)
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
 * min~max 실수 랜덤
 * @param {number} min 최소값
 * @param {number} max 최대값
 * @returns {number} 실수 랜덤값
 */
function random(min, max) {
  if (min > max) throw new Error("random오류: min은 max보다 작거나 같아야 합니다.");
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return min + (buffer[0] / 2 ** 32) * (max - min);
}

/**
 * min~max 정수 랜덤
 * @param {number} min 최소값
 * @param {number} max 최대값
 * @returns {number} 정수 랜덤값
 */
function randomInt(min, max) {
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
 * 주어진 숫자리르 지정한 단위로 반올림
 * @param {number} value 값
 * @param {number} unit 단위
 * @returns {number} 출력값
 */
function roundToNearest(value, unit) {
  return Math.round(value / unit) * unit;
}

/**
 * 리스트 셔플
 * @param {any[]} arr 섞을 리스트
 * @returns {any[]} 섞인 리스트
 */
function shuffle(arr) {
  const result = [...arr];
  for (let i=result.length-1; i>0; i--) {
    const j = this.randomInt(0, i);
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
  #potElement = document.getElementById("pot");
  #nextRoundBtn = document.getElementById("nextRound");

  /** @type {Player[]} 플레이어 목록 */
  players = [];
  /** @type {number} 처음 플레이어 */
  firstPlayerIndex = -1;
  /** @type {number} 현재 플레이어 */
  nowPlayerIndex = -1;
  /** @type {number} 승리 플레이어 */
  winPlayerIndex = -1;
  /** @type {number} 시작 금액 */
  startingMoney = -1;
  /** @type {string[]} 카드 전체 덱 */
  deck = [];
  /** @type {Card.Hand[]} 커뮤니티 카드 */
  communityCards = [];
  /** @type {number} 현재 배팅 금액 */
  currentBet = 0;
  /** @type {number} 판돈 */
  pot = 0;
  /** @type {number[]} 타임아웃 리스트 */
  setTimeoutList = [];
  /** @type {number} 카드 공개 딜레이 (ms) (def: 1000) */
  openDelay = 1000;
  /** @type {number[]} 봇 베팅 시간 [최소, 최대] */
  botBetDelay = [500, 1500];

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

    this.#nextRoundBtn.addEventListener("click", () => {
      // 여기에 다음라운드 코드 작성
      this.players[this.winPlayerIndex].money += this.pot;
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
    this.currentBet = 0;
    this.pot = 0;
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
   * 타임아웃 리스트에 추가
   * @param {Function} func 함수
   * @param {number} time 시간
   */
  addTimeout(func, time) {
    /** @type {number} timeout Id */
    let timeoutId;
    timeoutId = setTimeout(() => {
      const idx = this.setTimeoutList.indexOf(timeoutId);
      if (idx !== -1) this.setTimeoutList.splice(idx, 1);
      func();
    }, time);
    this.setTimeoutList.push(timeoutId);
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
        { suit: card1[0], rank: card1[2] ? "10" : card1[1] },
        { suit: card2[0], rank: card2[2] ? "10" : card2[1] },
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
          if (handOpenBtn.disabled) return;
          handOpenBtn.textContent = "카드가 공개되어있습니다!";
          handOpenBtn.classList.add("holding");
          for (let i=0; i<2; i++) cardsDIV.childNodes.forEach((card) => {
            card.classList.add("flip");
          });
        });
        handOpenBtn.addEventListener("mouseup", () => {
          if (handOpenBtn.disabled) return;
          handOpenBtn.textContent = "카드 확인하기";
          handOpenBtn.classList.remove("holding");
          for (let i=0; i<2; i++) cardsDIV.childNodes.forEach((card) => {
            card.classList.remove("flip");
          });
        });
        handOpenBtn.addEventListener("mouseleave", () => {
          if (handOpenBtn.disabled) return;
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
   * @param {Bet.Action} action 액션
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
      this.pot += minus;
      this.#potElement.textContent = `판돈 : ${this.pot.toLocaleString()}원`;
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
      this.pot += raiseMoney;
      this.#potElement.textContent = `판돈 : ${this.pot.toLocaleString()}원`;
      for (let i of this.players.map((p, i) => !p.game.fold && i !== this.nowPlayerIndex ? i : -1).filter(i => i !== -1)) this.players[i].game.check = false;
      player.game.check = true;
      temp = `레이즈 ${raiseMoney}원`;
    }

    if (action === "skip") {
      // 다음 라운드 (공유카드 공개 후)
      this.currentBet = 0;
      this.players.filter(p => !p.game.fold).forEach((p) => {
        p.game.bet = 0;
        p.game.check = false;
      });
      this.#betButtons.forEach(btn => btn.disabled = false);
    } else {
      // 공통처리
      player.game.history.push(action);
      const playerMoneyDIV = this.#slotElements.item(this.nowPlayerIndex).querySelector("#money");
      const playerTempDIV = this.#slotElements.item(this.nowPlayerIndex).querySelector("#temp");
      playerMoneyDIV.textContent = `${player.money}원`;
      playerTempDIV.textContent = temp;
      this.log(`플레이어 ${this.nowPlayerIndex+1}`, temp);
    }

    const nextPlayerIndex = this.getNextPlayerIndex();
    if (this.players.filter(p => !p.game.fold).length === 1) {
      // 혼자 남았을때
      this.nowPlayerIndex = -1;
      this.winPlayerIndex = this.players.findIndex(p => !p.game.fold);
      this.log("딜러", `플레이어 ${this.winPlayerIndex+1} 당신이 승리하셨습니다.`);
      this.log("딜러", `플레이어 ${this.winPlayerIndex+1} +${this.pot.toLocaleString()}원`);
      this.#nextRoundBtn.disabled = false;
      return;
    }
    const nextPlayer = this.players[nextPlayerIndex];
    if (!this.players.some(p => !p.game.fold && !p.game.check)) {
      // check를 전부 했을때 (raise한 당사자도 check)
      this.#slotElements.item(this.nowPlayerIndex).classList.remove("turn");
      this.#betButtons.forEach(btn => btn.disabled = true);
      this.players.filter(p => !p.game.fold).forEach(p => p.game.check = false);
      if (this.communityCards.length === 5) {
        this.nowPlayerIndex = nextPlayerIndex;
        return this.showDown();
      }
      return this.setCommunityCard();
    }
    // 아직 한바퀴 덜돔
    this.nowPlayerIndex = nextPlayerIndex;
    this.changeCallCheck(nextPlayer);
    this.#slotElements.item(nextPlayerIndex).querySelector("#temp").textContent = "베팅중...";
    this.#slotElements.item(nextPlayerIndex).classList.add("turn");
    this.log("딜러", `플레이어 ${nextPlayerIndex+1} 당신의 차례입니다.`);
    if (nextPlayer.type === "bot") {
      this.#betButtons.forEach(btn => btn.disabled = true);
      this.addTimeout(() => {
        this.botAction(nextPlayerIndex);
      }, randomInt(this.botBetDelay[0], this.botBetDelay[1]));
    } else {
      this.#betButtons.forEach(btn => btn.disabled = false);
    }
  }

  /**
   * 봇 베팅 함수
   * @param {number} index 플레이어 인덱스 번호
   */
  botAction(index) {
    const player = this.players[index];
    const hand = this.evaluateHand(player.hand);
    let indexList = this.players.map((p, i) => i).filter(i => i !== -1);
    let idx = indexList.indexOf(this.players.findIndex(p => p.first));
    if (idx !== -1) indexList = indexList.slice(idx).concat(indexList.slice(0, idx));
    indexList = indexList.map(i => !this.players[i].game.fold ? i : -1).filter(i => i !== -1);

    const { action, confidence } = this.botDecide(player, hand, indexList.indexOf(index));
    if (action === "raise") {
      this.#raiseInput.value = this.botRaiseAmount(player.personality, confidence, player.money);
      return this.betAction("raise");
    }
    return this.betAction(action);
  }

  /**
   * 봇 베팅 결정 함수
   * @param {Player} player 플레이어
   * @param {Card.Evaluate} hand 계산된 결과
   * @param {number} positionIndex 포지션 순서
   * @returns {{ action: Bet.Action; confidence: number; }} 리턴
   */
  botDecide(player, hand, positionIndex) {
    const rank = hand.rank;
    const gap = this.currentBet - player.game.bet;
    const ratio = gap / player.money; // 베팅금이 보유금에비해 얼마나 되는지
    // 기본 신뢰도 : 족보를 10점 만점으로 환산
    const baseConfidence = rank / 10;
    // 불확실성
    const noise = random(-0.2, 0.2);
    
    /** @type {number} 신뢰도 */
    let confidence = baseConfidence + noise;

    // 성향 보정
    if (player.personality === "aggressive") confidence += 0.15;
    if (player.personality === "passive") confidence -= 0.15;

    // 포지션 보정
    const posAdvantage = positionIndex / (this.players.length-1); // 0 ~ 1
    confidence += (posAdvantage-0.5) * 0.2; // -0.1 ~ 0.1 보정

    // 히스토리 보정 (최근 raise 했으면 bluff 성향 보정)
    const history = player.game.history?.filter(h => h !== "check") || [];
    const recentRaise = history.slice(-2).includes("raise");
    if (recentRaise && random(0, 1) < 0.3) confidence += 0.1; // 최근 레이즈 -> 계속 밀어붙이기
    if (history.every(act => act === "call")) confidence -= 0.1; // 지나치게 수동적 -> bluff 줄이기

    // 행동 결정
    if (rank <= 2 && ratio > 0.05 && random(0, 1) < 0.7) return { action: "fold", confidence };
    if (ratio > 0.3 && confidence < 0.5) return { action: "fold", confidence };

    if (confidence < 0.8) {
      if (ratio < 0.1) return { action: gap === 0 ? "check" : "call", confidence };
      if (random(0, 1) < 0.3) return { action: gap === 0 ? "check" : "call", confidence };
      return { action: "fold", confidence };
    }

    if (
      confidence > 1.0
      && random(0, 1) < (
        player.personality === "aggressive" ? 0.7 : 0.5
      )
    ) return { action: "raise", confidence };

    return { action: gap === 0 ? "check" : "call", confidence };
  }

  /**
   * 봇 레이즈 금액 결정
   * @param {Player.Personality} personality 플레이어 성향
   * @param {number} money 현재 소지금
   * @param {number} confidence 신뢰도
   * @returns {number} 레이즈 금액
   */
  botRaiseAmount(personality, confidence, money) {
    // 최소 레이즈: 현재 베팅의 1.5배
    const minRaise = Math.ceil(this.currentBet*1.5);
    // 배율 조정
    let multiplier = 1.5;

    // 성향 기반 배수 결정
    if (personality === "aggressive") multiplier = random(2.0, 3.5);
    else if (personality === "passive") multiplier = random(1.1, 1.7);
    else multiplier = random(1.5, 2.5);

    // 블러프
    if (confidence < 0.5 && personality === "aggressive" && random(0, 1) < 0.2) {
      const bluffRaise = Math.min(money, Math.round(minRaise*random(1.0, 1.3)));
      return Math.max(minRaise, roundToNearest(bluffRaise, 50));
    }

    // 손패가 강하면 더 크게 레이즈
    if (confidence > 1.0) multiplier *= random(1.1, 1.4);

    let raiseAmount = minRaise * multiplier;

    // 소지금 부족시 올인
    if (money <= minRaise*1.5 || raise >= money) return money;

    // 50단위 반올림
    raiseAmount = roundToNearest(raiseAmount, 50);

    // 최소 보장
    if (raiseAmount < minRaise) raiseAmount = minRaise;

    return raiseAmount;
  }

  /**
   * 커뮤니티 카드 가져오기
   */
  setCommunityCard() {
    let getNum = 1;
    if (this.communityCards.length === 0) getNum = 3;
    for (let i=0; i<getNum; i++) {
      const card = this.deck.pop();
      this.communityCards.push({ suit: card[0], rank: card[2] ? "10" : card[1] });
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
      this.addTimeout(() => {
        cardDIV.classList.add("flip");
        this.log("딜러", `공유카드 ${this.communityCards.length+i+1} : ${card}`);
      }, (i+1)*this.openDelay);
    }
    this.log("딜러", `공유카드 ${getNum}장 공개`);
    this.addTimeout(() => {
      // 카드 공개후 함수
      this.betAction("skip");
    }, (getNum+1)*this.openDelay);
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

  /**
   * 남은 플레이어 패 비교
   */
  showDown() {
    this.log("딜러", "패 확인");
    this.log("딜러", `공유카드 : ${this.communityCards.map(c => c.suit+c.rank).join(',')}`);
    let indexList = this.players.map((p, i) => !p.game.fold ? i : -1).filter(i => i !== -1);
    let idx = indexList.indexOf(this.nowPlayerIndex);
    if (idx !== -1) indexList = indexList.slice(idx).concat(indexList.slice(0, idx));
    /** @type {{[key: number]: Card.Evaluate}} */
    const hands = {};
    for (let i of indexList) hands[i] = this.evaluateHand(this.players[i].hand);
    this.winPlayerIndex = this.compareHands(hands);
    
    console.log('플레이어 전체',hands);
    console.log('승자: 플레이어',this.winPlayerIndex+1);
    console.log('판돈:', this.pot.toLocaleString()+"원");
    console.log('승자 정보',hands[this.winPlayerIndex]);

    for (let i=0; i<indexList.length; i++) {
      if (this.players[indexList[i]].type === "human") {
        this.#slotElements.item(indexList[i]).querySelector("#handOpen").textContent = "카드 공개";
        this.#slotElements.item(indexList[i]).querySelector("#handOpen").disabled = true;
      }

      this.addTimeout(() => {
        this.#slotElements.item(indexList[i]).querySelector("#playerCards").childNodes.forEach((card) => {
          card.classList.add("flip");
        });
        this.log("딜러", `플레이어 ${indexList[i]+1} : ${this.players[indexList[i]].hand.map(c => c.suit+c.rank).join(',')}`);
      }, (i+1)*this.openDelay);
    }
    
    this.addTimeout(() => {
      for (let i=0; i<indexList.length; i++) {
        this.#slotElements.item(indexList[i]).querySelector("#temp").textContent = `${indexList[i] === this.winPlayerIndex ? "승리" : "패배"} : ${hands[indexList[i]].name}`;
      }
      this.log("딜러", `플레이어 ${this.winPlayerIndex+1} 승리: ${hands[this.winPlayerIndex].name} ${hands[this.winPlayerIndex].hand.map(c => c.suit+c.rank).join(',')}`);
      this.log("딜러", `플레이어 ${this.winPlayerIndex+1} +${this.pot.toLocaleString()}원`);
      this.#nextRoundBtn.disabled = false;
    }, (indexList.length+1)*this.openDelay);
    // 다음 라운드 어떻게 할건지랑 베팅 금액 처리 만들어야됨
  }

  /**
   * 카드 판정
   * @param {Card.Hand[]} cards 손패 리스트
   * @returns {Card.Evaluate}
   */
  evaluateHand(cards) {
    /** @type {Card.Value[]} 내림차순 정렬 */
    const parsed = cards.concat(this.communityCards).map(c => ({
      ...c,
      value: c.rank === 'J' ? 11
      : c.rank === 'Q' ? 12
      : c.rank === 'K' ? 13
      : c.rank === 'A' ? 14
      : parseInt(c.rank)
    })).sort((a,b) => b.value-a.value);

    /** @type {Map<Card.Rank, Card.Value[]>} */
    const byRank = new Map();
    /** @type {Map<Card.Suit, Card.Value[]>} */
    const bySuit = new Map();

    for (const c of parsed) {
      if (!byRank.has(c.rank)) byRank.set(c.rank, []);
      if (!bySuit.has(c.suit)) bySuit.set(c.suit, []);
      byRank.get(c.rank).push(c);
      bySuit.get(c.suit).push(c);
    }

    const rankGroups = [...byRank.values()].sort((a,b) => 
      b.length-a.length || b[0].value - a[0].value
    );

    const flushGroup = [...bySuit.values()].find(g => g.length >= 5);

    const uniqueValues = [...new Set(parsed.map(c => c.value))];
    if (uniqueValues.includes(14)) uniqueValues.push(1); // A는 1도 가능

    const straight = this.findStraight(uniqueValues);

    // 스트레이트 플러시 & 로열 스트레이트 플러시
    if (flushGroup) {
      const flushUnique = [...new Set(flushGroup.map(c => c.value).sort((a,b) => b-a))];
      if (flushUnique.includes(14)) flushUnique.push(1); // A는 1도 가능
      const sf = this.findStraight(flushUnique);
      if (sf) return {
        rank: sf[0] === 14 ? 10 : 9,
        name: sf[0] === 14 ? "로열 스트레이트 플러시" : "스트레이트 플러시",
        hand: flushGroup.filter(c => sf.includes(c.value)).slice(0, 5),
        kickers: [],
      };
    }

    // 포카드
    if (rankGroups[0].length === 4) {
      const hands = [...rankGroups[0]];
      return {
        rank: 8,
        name: "포카드",
        hand: hands,
        kickers: [...parsed.find(c => c.rank !== hands.rank)],
      };
    }

    // 풀하우스
    if (rankGroups[0].length === 3 && rankGroups[1]?.length >= 2) return {
      rank: 7,
      name: "풀하우스",
      hand: [...rankGroups[0], ...rankGroups[1].slice(0,2)],
      kickers: [],
    };

    // 플러시
    if (flushGroup) {
      const hands = flushGroup.slice(0,5);
      return {
        rank: 6,
        name: "플러시",
        hand: hands,
        kickers: parsed.filter(c => !hands.includes(c)).map( c => c.value),
      };
    }

    // 스트레이트
    if (straight) {
      const straightCards = [];
      for (let v of straight) {
        const c = parsed.find(c => c.value === v && !straightCards.includes(c));
        straightCards.push(c);
      }
      return {
        rank: 5,
        name: "스트레이트",
        hand: straightCards,
        kickers: [],
      };
    }

    // 트리플
    if (rankGroups[0].length === 3) {
      const hands = [...rankGroups[0]];
      return {
        rank: 4,
        name: "트리플",
        hand: hands,
        kickers: parsed.filter(c => c.rank !== hands[0].rank).map(c => c.value),
      };
    }

    // 투페어
    if (rankGroups[0].length === 2 && rankGroups[1]?.length === 2) {
      const hands = [...rankGroups[0], ...rankGroups[1]];
      return {
        rank: 3,
        name: "투페어",
        hand: hands,
        kickers: parsed.filter(c => c.rank !== rankGroups[0][0].rank && c.rank !== rankGroups[1][0].rank).map(c => c.value),
      };
    }

    // 원페어
    if (rankGroups[0].length === 2) {
      const hands = [...rankGroups[0]];
      return {
        rank: 2,
        name: "원페어",
        hand: hands,
        kickers: parsed.filter(c => c.rank !== hands[0].rank).slice(0,3).map( c=> c.value),
      };
    }

    // 하이카드
    return {
      rank: 1,
      name: "하이카드",
      hands: parsed.slice(0,5),
      kickers: parsed.slice(5).map(c => c.value),
    };
  }

  /**
   * 스트레이트인지 확인
   * @param {number[]} values value 리스트
   * @returns {number[]|null}
   */
  findStraight(values) {
    for (let i=0; i<=values.length-5; i++) {
      const slice = values.slice(i, i+5);
      if (slice[0]-slice[4] === 4 && new Set(slice).size === 5) return slice;
    }
    return null;
  }

  /**
   * 카드를 비교해서 이긴 플레이어의 인덱스 번호를 출력
   * @param {{[key: number]: Card.Evaluate}} handObj key: players index, value: evaluate return
   * @returns {number}
   */
  compareHands(handObj) {
    const players = Object.entries(handObj);

    // 1. 우선순위: rank -> hand -> kickers
    players.sort(([,a],[,b]) => {
      if (a.rank !== b.rank) return b.rank - a.rank;
      for (let i=0; i<5; i++) {
        const av = a.hand[i]?.value || 0;
        const bv = b.hand[i]?.value || 0;
        if (av !== bv) return bv - av;
      }
      for (let i=0; i<Math.max(a.kickers.length, b.kickers.length); i++) {
        const ak = a.kickers[i] || 0;
        const bk = b.kickers[i] || 0;
        if (ak !== bk) return bk - ak;
      }

      return 0; // 완벽히 동일
    });
    
    const best = players[0][1];
    return players.filter(([, p]) => 
      p.rank === best.rank
    && JSON.stringify(p.hand.map(c => c.value)) === JSON.stringify(best.hand.map(c => c.value))
    && JSON.stringify(p.kickers) === JSON.stringify(best.kickers)
    ).map(([i,]) => parseInt(i))[0];
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
      { type: "human", money: -1, hand: [], first: true, game: { bet: 0, check: false, fold: false, history: [] } },
    ];
    this.render();

    this.addPlayerBtn.addEventListener("click", () => {
      if (this.gameClass.players.length >= max_players) return;
      this.gameClass.players.push({ type: "human", money: -1, hand: [], first: false, game: { bet: 0, check: false, fold: false, history: [] } });
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