/* Toggle between adding and removing the "responsive" class to topnav when the user clicks on the icon */
function myFunction() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
      x.className += " responsive";
    } else {
      x.className = "topnav";
    }
  }
const images = [
    "img/balint1.png",
    "img/balint2.png",
    "img/balint3.png",
    "img/balint4.png",
    "img/balint5.png"
  ];
  
  const reels = [
    document.getElementById("reel1"),
    document.getElementById("reel2"),
    document.getElementById("reel3")
  ];
  
  const resultText = document.getElementById("resultText");
  const pointsDisplay = document.getElementById("pointsDisplay");
  const spinBtn = document.getElementById("spinBtn");
  const betInput = document.getElementById("betAmount");
  
  let points = parseInt(localStorage.getItem("pts")) || 0;
  updatePointsDisplay();
  
  spinBtn.addEventListener("click", spin);
  
  function spin() {
    const bet = parseInt(betInput.value);
  
    if (isNaN(bet) || bet <= 0) {
      resultText.textContent = "Kérlek adj meg egy érvényes tétet!";
      return;
    }
  
    if (points < bet) {
      resultText.textContent = "Nincs elég pontod!";
      return;
    }
  
    // levonás pörgetés előtt
    points -= bet;
    updatePointsDisplay();
    localStorage.setItem("pts", points);
  
    resultText.textContent = "Pörgetés folyamatban...";
    spinBtn.disabled = true;
  
    // animáció – gyors váltás 700 ms-ig
    let animationTime = 700;
    let interval = setInterval(() => {
      reels.forEach(reel => {
        let randomImage = images[Math.floor(Math.random() * images.length)];
        reel.innerHTML = `<img src="${randomImage}" alt="">`;
      });
    }, 80);
  
    setTimeout(() => {
      clearInterval(interval);
  
      let results = [];
      for (let i = 0; i < 3; i++) {
        let randomImage = images[Math.floor(Math.random() * images.length)];
        reels[i].innerHTML = `<img src="${randomImage}" alt="">`;
        results.push(randomImage);
      }
  
      checkResult(results, bet);
      spinBtn.disabled = false;
    }, animationTime);
  }
  
  function checkResult(results, bet) {
    if (results[0] === results[1] && results[1] === results[2]) {
      const win = bet * 10;
      points += win;
      resultText.textContent = `JACKPOT! +${win} pont!`;
    } else if (
      results[0] === results[1] ||
      results[1] === results[2] ||
      results[0] === results[2]
    ) {
      const win = bet * 3;
      points += win;
      resultText.textContent = `Kettő egyezik! +${win} pont!`;
    } else {
      resultText.textContent = "Próbáld újra!";
    }
  
    localStorage.setItem("pts", points);
    updatePointsDisplay();
  }
  
  function updatePointsDisplay() {
    pointsDisplay.textContent = `Bálint érmék: ${points}`;
  }
  