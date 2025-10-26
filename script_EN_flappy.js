function myFunction() {
  var x = document.getElementById("myTopnav");
  if (x.className === "topnav") {
    x.className += " responsive";
  } else {
    x.className = "topnav";
  }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const scoreDiv = document.getElementById('score');

const birdImg = new Image();
birdImg.src = 'fejed.png';

const pipeImg = new Image();
pipeImg.src = 'https://eforms.com/images/2018/03/Employment-Job-Application.png';

const pipeWidth = 60;
const pipeGap = 200;
const gravity = 0.6;
const jump = -10;

let bird, pipes, score, gameOver, animFrameId;
let gameReady = false; // 🔹 új állapot: várakozás az első kattintásra
let gameStarted = false;

// Játék inicializálása (de még nem indul el)
function initGame() {
  bird = { x: 80, y: 300, vy: 0, width: 50, height: 50 };
  pipes = [];
  score = 0;
  gameOver = false;
  gameReady = true;
  gameStarted = false;
  startBtn.style.display = 'none';
  scoreDiv.textContent = 'Score: 0';

  if (animFrameId) cancelAnimationFrame(animFrameId);

  // Rajzoljuk ki az induló képernyőt
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("Click to start!", 130, canvas.height / 2);
}

// Első kattintás / ugrás kezelése
canvas.addEventListener('click', () => {
  if (gameOver) return;

  if (!gameStarted && gameReady) {
    gameStarted = true;
    gameReady = false;
    update(); // 🔹 most indul el a játék
  }

  if (gameStarted) {
    bird.vy = jump; // ugrás
  }
});

// Start gomb
startBtn.addEventListener('click', initGame);

// Csövek létrehozása
function createPipe() {
  let topHeight = Math.random() * (canvas.height - pipeGap - 100) + 50;
  pipes.push({ x: canvas.width, top: topHeight });
}

// Ütközés
function checkCollision(pipe) {
  if (bird.x + bird.width > pipe.x && bird.x < pipe.x + pipeWidth) {
    if (bird.y < pipe.top || bird.y + bird.height > pipe.top + pipeGap) return true;
  }
  if (bird.y + bird.height > canvas.height || bird.y < 0) return true;
  return false;
}

// Frissítés
function update() {
  if (gameOver) return;

  bird.vy += gravity;
  bird.y += bird.vy;

  if (pipes.length === 0 || canvas.width - pipes[pipes.length - 1].x > 200) createPipe();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < pipes.length; i++) {
    let p = pipes[i];
    ctx.drawImage(pipeImg, p.x, 0, pipeWidth, p.top);
    ctx.drawImage(pipeImg, p.x, p.top + pipeGap, pipeWidth, canvas.height - p.top - pipeGap);
    p.x -= 2;

    if (!p.scored && p.x + pipeWidth < bird.x) {
      score++;
      p.scored = true;
      scoreDiv.textContent = 'Score: ' + score;
    }

    if (checkCollision(p)) {
      gameOver = true;
      startBtn.style.display = 'block';
    }
  }

  ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  if (!gameOver) animFrameId = requestAnimationFrame(update);
}

// Indítás után a gomb látszik
window.addEventListener('load', () => {
  startBtn.style.display = 'block';
});
