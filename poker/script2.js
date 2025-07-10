const playerList = document.getElementById("playerList");
const addPlayerBtn = document.getElementById("addPlayer");
const startGameBtn = document.getElementById("startGame");
const revealButton = document.createElement("button");
revealButton.textContent = "공유 카드 공개";
revealButton.style.marginTop = "10px";
revealButton.disabled = true;
document.getElementById("gameScreen").appendChild(revealButton);

const startingMoneyInput = document.getElementById("startingMoney");

let dynamicPlayers = [];
const maxPlayers = 4;

// 고정된 Player 1 항목 추가
const player1 = document.createElement("li");
player1.className = "player-item fixed";
player1.textContent = "플레이어 1 (사람)";
playerList.appendChild(player1);

function updateStartButtonState() {
  startGameBtn.disabled = (1 + dynamicPlayers.length) < 2;
}

function createPlayerItem(index, type = "player") {
  const li = document.createElement("li");
  li.className = "player-item";
  li.dataset.index = index;

  const label = document.createElement("span");
  label.textContent = `플레이어 ${index + 1} (${type === "bot" ? "로봇" : "사람"})`;
  li.appendChild(label);

  const select = document.createElement("select");
  select.innerHTML = `
      <option value="player" ${type === "player" ? "selected" : ""}>사람</option>
      <option value="bot" ${type === "bot" ? "selected" : ""}>로봇</option>
    `;
  select.addEventListener("change", () => {
    label.textContent = `플레이어 ${index + 1} (${select.value === "bot" ? "로봇" : "사람"})`;
  });
  li.appendChild(select);

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "삭제";
  removeBtn.className = "remove-btn";
  removeBtn.onclick = () => {
    li.remove();
    dynamicPlayers.splice(dynamicPlayers.findIndex(p => p.index === index), 1);
    updateStartButtonState();
  };
  li.appendChild(removeBtn);

  return li;
}

addPlayerBtn.addEventListener("click", () => {
  if (dynamicPlayers.length + 1 >= maxPlayers) return;

  const newIndex = dynamicPlayers.length + 1;
  const li = createPlayerItem(newIndex);
  playerList.appendChild(li);
  dynamicPlayers.push({ index: newIndex, type: "player" });

  updateStartButtonState();
});

startGameBtn.addEventListener("click", () => {
  const startingMoney = parseInt(startingMoneyInput.value);
  const smallBlind = Math.floor(startingMoney/100);
  const bigBlind = smallBlind * 2;

  document.getElementById("mainMenu").classList.add("hidden");
  document.getElementById("gameScreen").classList.remove("hidden");

  const players = [
    { name: "플레이어 1", type: "사람", money: startingMoney },
  ];
  dynamicPlayers.forEach(p => players.push({
    name: `플레이어 ${p.index + 1}`,
    type: p.type === "bot" ? "로봇" : "사람",
    money: startingMoney,
  }));

  const slotElements = document.querySelectorAll(".player-slot");
  slotElements.forEach((slot, i) => {
    const player = players[i];
    if (!player) {
      slot.classList.add("hidden");
    } else {
      slot.classList.remove("hidden");
      slot.innerHTML = `<div><strong>${player.name}</strong></div><div>${player.money.toLocaleString()}원</div>`;
    }
  });

  slotElements[1]?.insertAdjacentHTML("beforeend", `<div>(SB)</div>`);
  slotElements[2]?.insertAdjacentHTML("beforeend", `<div>(BB)</div>`);

  setupGame(players);
  revealButton.disabled = false;
});

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
let deck = [];
let communityCardIndex = 0;

function shuffleDeck() {
  deck = [];
  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push(rank + suit);
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function dealCard(faceUp = true, cardValue = '') {
  const card = document.createElement('div');
  card.className = 'card' + (faceUp ? '' : ' back');
  card.textContent = faceUp ? cardValue : '';
  return card;
}

function dealToPlayers(players) {
  const slotElements = document.querySelectorAll('.player-slot');
  players.forEach((player, i) => {
    const slot = slotElements[i];
    slot.innerHTML = `<div><strong>${player.name}</strong></div><div>${player.money.toLocaleString()}원</div>`;
    const cardContainer = document.createElement('div');
    cardContainer.className = 'card-container';

    const card1 = deck.pop();
    const card2 = deck.pop();

    cardContainer.appendChild(dealCard(player.type === '사람', card1));
    cardContainer.appendChild(dealCard(player.type === '사람', card2));

    slot.appendChild(cardContainer);
  });
}

function revealCommunityCard() {
  const communityContainer = document.getElementById("communityCards");
  const revealOrder = [3, 1, 1];
  if (communityCardIndex < revealOrder.length) {
    for (let i = 0; i < revealOrder[communityCardIndex]; i++) {
      const card = dealCard(true, deck.pop());
      communityContainer.appendChild(card);
    }
    communityCardIndex++;
    if (communityCardIndex >= revealOrder.length) {
      revealButton.disabled = true;
    }
  }
}

revealButton.addEventListener("click", revealCommunityCard);

window.setupGame = function(players) {
  shuffleDeck();
  dealToPlayers(players);
};
// 족보 판단 유틸리티
const rankValues = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

function parseCard(card) {
  const match = card.match(/^(10|[2-9JQKA])([♠♥♦♣])$/);
  if (!match) return null;
  return { rank: match[1], suit: match[2], value: rankValues[match[1]] };
}

function evaluateHand(cards) {
  const parsed = cards.map(parseCard).sort((a, b) => b.value - a.value);

  const byRank = {};
  const bySuit = {};
  parsed.forEach(c => {
    byRank[c.rank] = (byRank[c.rank] || []).concat(c);
    bySuit[c.suit] = (bySuit[c.suit] || []).concat(c);
  });

  const flush = Object.values(bySuit).find(suitGroup => suitGroup.length >= 5);

  const values = [...new Set(parsed.map(c => c.value))].sort((a, b) => b - a);
  if (values.includes(14)) values.push(1); // A-2-3-4-5 스트레이트 처리

  let straight = null;
  for (let i = 0; i <= values.length - 5; i++) {
    const slice = values.slice(i, i + 5);
    if (slice[0] - slice[4] === 4) {
      straight = slice;
      break;
    }
  }

  // 스트레이트 플러시
  if (flush) {
    const flushValues = flush.map(c => c.value).sort((a, b) => b - a);
    const unique = [...new Set(flushValues)];
    if (unique.includes(14)) unique.push(1);
    for (let i = 0; i <= unique.length - 5; i++) {
      const slice = unique.slice(i, i + 5);
      if (slice[0] - slice[4] === 4) {
        return {
          rank: slice[0] === 14 ? 10 : 9,
          name: slice[0] === 14 ? '로열 스트레이트 플러시' : '스트레이트 플러시',
          bestHand: flush.filter(c => slice.includes(c.value)).slice(0, 5),
          kickers: []
        };
      }
    }
  }

  const rankGroups = Object.values(byRank).sort((a, b) => b.length - a.length || b[0].value - a[0].value);

  // 포카드
  if (rankGroups[0].length === 4) {
    return {
      rank: 8,
      name: '포카드',
      bestHand: rankGroups[0].concat(parsed.find(c => c.rank !== rankGroups[0][0].rank)),
      kickers: []
    };
  }

  // 풀하우스
  if (rankGroups[0].length === 3 && rankGroups[1]?.length >= 2) {
    return {
      rank: 7,
      name: '풀하우스',
      bestHand: rankGroups[0].concat(rankGroups[1].slice(0, 2)),
      kickers: []
    };
  }

  // 플러시
  if (flush) {
    return {
      rank: 6,
      name: '플러시',
      bestHand: flush.slice(0, 5),
      kickers: []
    };
  }

  // 스트레이트
  if (straight) {
    const straightCards = [];
    for (let v of straight) {
      const c = parsed.find(c => c.value === v);
      straightCards.push(c);
    }
    return {
      rank: 5,
      name: '스트레이트',
      bestHand: straightCards,
      kickers: []
    };
  }

  // 트리플
  if (rankGroups[0].length === 3) {
    return {
      rank: 4,
      name: '트리플',
      bestHand: rankGroups[0].concat(parsed.filter(c => c.rank !== rankGroups[0][0].rank).slice(0, 2)),
      kickers: []
    };
  }

  // 투 페어
  if (rankGroups[0].length === 2 && rankGroups[1]?.length === 2) {
    return {
      rank: 3,
      name: '투 페어',
      bestHand: rankGroups[0].concat(rankGroups[1]).concat(parsed.find(c => c.rank !== rankGroups[0][0].rank && c.rank !== rankGroups[1][0].rank)),
      kickers: []
    };
  }

  // 원 페어
  if (rankGroups[0].length === 2) {
    return {
      rank: 2,
      name: '원 페어',
      bestHand: rankGroups[0].concat(parsed.filter(c => c.rank !== rankGroups[0][0].rank).slice(0, 3)),
      kickers: []
    };
  }

  // 하이 카드
  return {
    rank: 1,
    name: '하이 카드',
    bestHand: parsed.slice(0, 5),
    kickers: []
  };
}

// 턴 및 베팅 순서 관련 로직
let currentTurn = 0;
let currentBet = 0;
let pot = 0;
let playerStates = []; // [{ money, bet, folded, type }]

function initializeTurn(players, startingMoney) {
  playerStates = players.map(p => ({
    name: p.name,
    type: p.type,
    money: startingMoney,
    bet: 0,
    folded: false
  }));

  currentTurn = 0;
  currentBet = 0;
  pot = 0;
  updateTurnUI();
}

function updateTurnUI() {
  const info = document.getElementById("turnInfo");
  const p = playerStates[currentTurn];
  info.textContent = `${p.name} 차례 (${p.type === "로봇" ? "자동" : "수동"})`;

  const actionPanel = document.getElementById("actionPanel");
  actionPanel.innerHTML = "";
  if (p.folded) {
    nextTurn();
    return;
  }

  if (p.type === "로봇") {
    // 간단한 봇 AI: 항상 콜 또는 폴드
    setTimeout(() => {
      const callAmount = currentBet - p.bet;
      if (p.money >= callAmount) {
        p.money -= callAmount;
        pot += callAmount;
        p.bet += callAmount;
      } else {
        p.folded = true;
      }
      nextTurn();
    }, 500);
  } else {
    const callBtn = document.createElement("button");
    callBtn.textContent = "콜";
    callBtn.onclick = () => {
      const callAmount = currentBet - p.bet;
      if (p.money >= callAmount) {
        p.money -= callAmount;
        pot += callAmount;
        p.bet += callAmount;
      }
      nextTurn();
    };

    const raiseBtn = document.createElement("button");
    raiseBtn.textContent = "레이즈";
    raiseBtn.onclick = () => {
      const raiseAmount = currentBet + 10; // 고정 raise
      const diff = raiseAmount - p.bet;
      if (p.money >= diff) {
        p.money -= diff;
        pot += diff;
        p.bet = raiseAmount;
        currentBet = raiseAmount;
      }
      nextTurn();
    };

    const foldBtn = document.createElement("button");
    foldBtn.textContent = "폴드";
    foldBtn.onclick = () => {
      p.folded = true;
      nextTurn();
    };

    actionPanel.appendChild(callBtn);
    actionPanel.appendChild(raiseBtn);
    actionPanel.appendChild(foldBtn);
  }
}

function nextTurn() {
  currentTurn = (currentTurn + 1) % playerStates.length;
  if (playerStates.every(p => p.folded || p.bet === currentBet)) {
    endRound();
  } else {
    updateTurnUI();
  }
}

function endRound() {
  const info = document.getElementById("turnInfo");
  info.textContent = `라운드 종료. 총 팟: ${pot.toLocaleString()}원`;
  document.getElementById("actionPanel").innerHTML = "";
}
