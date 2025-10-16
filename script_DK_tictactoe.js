/* Skift mellem at tilføje og fjerne "responsive"-klassen i topnav, når brugeren klikker på ikonet */
function myFunction() {
  var x = document.getElementById("myTopnav");
  if (x.className === "topnav") {
    x.className += " responsive";
  } else {
    x.className = "topnav";
  }
}

const board = document.getElementById("board");
const message = document.getElementById("message");
const restartBtn = document.getElementById("restartBtn");

let gameState = ["", "", "", "", "", "", "", "", ""];
let gameActive = true;
let currentPlayer = "X";

// Opret spillebrættet
for (let i = 0; i < 9; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  cell.dataset.index = i;
  cell.addEventListener("click", handleClick);
  board.appendChild(cell);
}

const cells = document.querySelectorAll(".cell");

function handleClick(e) {
  const index = e.target.dataset.index;
  if (!gameActive || gameState[index] !== "") return;

  gameState[index] = currentPlayer;
  e.target.innerHTML = '<img src="x.png" alt="X">';

  if (checkWin(currentPlayer)) {
    message.textContent = "Du vandt!";
    gameActive = false;
    return;
  }

  if (!gameState.includes("")) {
    message.textContent = "Det blev uafgjort!";
    gameActive = false;
    return;
  }

  message.textContent = "Bálint tænker...";
  setTimeout(aiMove, 500);
}

function aiMove() {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  // 1️⃣ Prøv at vinde
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    const values = [gameState[a], gameState[b], gameState[c]];
    if (values.filter(v => v === "O").length === 2 && values.includes("")) {
      const move = pattern[values.indexOf("")];
      makeAiMove(move);
      return;
    }
  }

  // 2️⃣ Hvis ikke muligt, blokér spilleren
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    const values = [gameState[a], gameState[b], gameState[c]];
    if (values.filter(v => v === "X").length === 2 && values.includes("")) {
      const move = pattern[values.indexOf("")];
      makeAiMove(move);
      return;
    }
  }

  // 3️⃣ Ellers vælg et tilfældigt felt
  const emptyCells = gameState
    .map((val, idx) => (val === "" ? idx : null))
    .filter((val) => val !== null);

  if (emptyCells.length === 0) return;
  const randomIndex =
    emptyCells[Math.floor(Math.random() * emptyCells.length)];
  makeAiMove(randomIndex);
}

function makeAiMove(index) {
  gameState[index] = "O";
  cells[index].innerHTML = '<img src="o.png" alt="O" width="70" height="70">';
  if (checkWin("O")) {
    message.textContent = "Bálint vandt!";
    gameActive = false;
  } else if (!gameState.includes("")) {
    message.textContent = "Det blev uafgjort!";
    gameActive = false;
  } else {
    message.textContent = "Din tur!";
  }
}

function checkWin(player) {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  return winPatterns.some((pattern) =>
    pattern.every((index) => gameState[index] === player)
  );
}

restartBtn.addEventListener("click", restartGame);

function restartGame() {
  gameState = ["", "", "", "", "", "", "", "", ""];
  gameActive = true;
  message.textContent = "Din tur!";
  cells.forEach((cell) => (cell.innerHTML = ""));
}
