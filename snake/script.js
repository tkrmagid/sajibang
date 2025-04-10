// 캔버스와 컨텍스트 초기화
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 게임 변수 초기화
const gameSpeed = 1; // 게임속도
const maxSize = 10; // 총 칸수
let snakeSize = 20; // 스네이크 한 칸의 크기
let snake = [{ x: 200, y: 200 }]; // 스네이크 초기 위치
let direction = 'RIGHT'; // 초기 이동 방향
let food = generateFood(); // 초기 음식 위치
let score = 0; // 초기 점수
let changeDirectionOnce = false; // 한번에 한방향으로 움직이는지
let gameOver = false; // 게임 오버 상태

winResize();
function winResize() {
  if (window.innerWidth > window.innerHeight) {
    canvas.width = window.innerHeight/100*80;
    canvas.height = canvas.width;
  } else {
    canvas.width = window.innerWidth/100*80;
    canvas.height = canvas.width;
  }
  console.log(canvas.width, canvas.height)
  snakeSize = canvas.width/maxSize;
  snake = [{ x: canvas.width/2-snakeSize, y: canvas.width/2-snakeSize }];
  food = generateFood();
}

window.addEventListener('resize', winResize);

// 키보드 입력 처리
document.addEventListener('keydown', changeDirection);

// 게임 루프 실행
function gameLoop() {
  if (gameOver) {
    displayGameOver();
    return;
  }

  setTimeout(() => {
    clearCanvas();
    drawFood();
    moveSnake();
    drawSnake();
    checkCollision();
    gameLoop();
  }, 1/gameSpeed * 200); // 게임 속도 조절 (100ms)
}

// 캔버스 지우기
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// 스네이크 그리기
function drawSnake() {
  ctx.fillStyle = 'green';
  snake.forEach(segment => {
    console.log(segment);
    ctx.fillRect(segment.x, segment.y, snakeSize, snakeSize);
  });
}

// 음식 그리기
function drawFood() {
  ctx.fillStyle = 'red';
  ctx.fillRect(food.x, food.y, snakeSize, snakeSize);
}

// 스네이크 이동
function moveSnake() {
  const head = { ...snake[0] };

  switch (direction) {
    case 'UP':
      head.y -= snakeSize;
      break;
    case 'DOWN':
      head.y += snakeSize;
      break;
    case 'LEFT':
      head.x -= snakeSize;
      break;
    case 'RIGHT':
      head.x += snakeSize;
      break;
  }

  snake.unshift(head);

  // 음식과 충돌 시
  if (
    head.x >= food.x-1
    && head.x <= food.x+1
    && head.y >= food.y-1
    && head.y <= food.y+1
  ) {
    score += 1;
    food = generateFood();
  } else {
    snake.pop();
  }

  changeDirectionOnce = false;
}

// 방향 변경
function changeDirection(event) {
  const keyPressed = event.key;

  let newDirection;
  switch (keyPressed) {
    case 'ArrowUp':
      newDirection = 'UP';
      break;
    case 'ArrowDown':
      newDirection = 'DOWN';
      break;
    case 'ArrowLeft':
      newDirection = 'LEFT';
      break;
    case 'ArrowRight':
      newDirection = 'RIGHT';
      break;
    default:
      return;
  }

  // 같은 방향으로는 이동 불가
  if (newDirection === direction) return;

  // 방향변경을 한적 없으면 실행
  if (!changeDirectionOnce) {
    direction = newDirection;
    changeDirectionOnce = true;
  }
}

// 음식 생성
function generateFood() {
  const x = Math.floor(Math.random() * maxSize) * snakeSize;
  const y = Math.floor(Math.random() * maxSize) * snakeSize;

  // 음식이 스네이크와 겹치지 않도록 확인
  if (snake.some(segment => 
    segment.x <= x-1
    && segment.x >= x+1
    && segment.y <= y-1
    && segment.y >= y+1
  )) {
    return generateFood();
  }
  console.log('food', x, y)
  return { x, y };
}

// 충돌 검사
function checkCollision() {
  const head = snake[0];

  // 벽과 충돌 시
  if (
    head.x < -1 ||
    head.x >= canvas.width -1 ||
    head.y < -1 ||
    head.y >= canvas.height -1
  ) {
    gameOver = true;
  }

    // 자기 자신과 충돌 시
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      gameOver = true;
      break;
    }
  }
}

// 게임 오버 표시
function displayGameOver() {
  ctx.fillStyle = 'black';
  ctx.font = '30px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('게임 오버', canvas.width / 2, canvas.height / 2);
  ctx.fillText(`점수: ${score}`, canvas.width / 2, canvas.height / 2 + 40);

  // 게임 재시작
  document.addEventListener('keydown', restartGame);
}

// 게임 재시작
function restartGame(event) {
  if (event.key === 'Enter') {
    // 변수 초기화
    snake = [{ x: 200, y: 200 }];
    direction = 'RIGHT';
    food = generateFood();
    score = 0;
    gameOver = false;

    // 이벤트 리스너 제거
    document.removeEventListener('keydown', restartGame);

    // 게임 루프 재개
    gameLoop();
  }
}

// 게임 시작
gameLoop();
