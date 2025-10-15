let pts = 0;

// amikor betölt az oldal, próbálja betölteni a mentett pontot
window.onload = function() {
  const savedpts = localStorage.getItem("pts");
  if (savedpts) {
    pts = parseInt(savedpts);
  }
  frissitPont();
};

function buttonClicked() {
  pts++;
  localStorage.setItem("pts", pts); // mentés minden kattintásnál
  frissitPont();
}

function frissitPont() {
  document.getElementById("mainDiv").innerText = "pts: " + pts;
}

function myFunction() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
      x.className += " responsive";
    } else {
      x.className = "topnav";
    }
  }