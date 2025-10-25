// --- Navigationsmenu på mobil ---
function myFunction() {
  const x = document.getElementById("myTopnav");
  if (x.className === "topnav") x.className += " responsive";
  else x.className = "topnav";
}

// --- Firebase initialisering ---
const firebaseConfig = {
  apiKey: "AIzaSyC5PGp0CIL-NGzv0bh3EEfdr4JjHjBp4FE",
  authDomain: "szucsbalinthu.firebaseapp.com",
  projectId: "szucsbalinthu",
  storageBucket: "szucsbalinthu.firebasestorage.app",
  messagingSenderId: "226319656079",
  appId: "1:226319656079:web:d86b6062d0fd4b6499bcfa",
  measurementId: "G-F5GPHLJS9Y"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// --- Elementer ---
const toggleLoginBtn = document.getElementById("toggleLoginBtn");
const authPanel = document.getElementById("authPanel");
const email = document.getElementById("email");
const password = document.getElementById("password");
const username = document.getElementById("username");
const loginBtn = document.getElementById("loginBtn");
const registerToggleBtn = document.getElementById("registerToggleBtn");
const logoutBtn = document.getElementById("logoutBtn");
const postPanel = document.getElementById("postPanel");
const message = document.getElementById("message");
const postBtn = document.getElementById("postBtn");
const postsContainer = document.getElementById("postsContainer");

// --- Panel visning ---
let registerMode = false;
toggleLoginBtn.onclick = () => {
  if (authPanel.style.display === "none" || authPanel.style.display === "") {
    authPanel.style.display = "block";
    toggleLoginBtn.textContent = "Luk";
  } else {
    authPanel.style.display = "none";
    toggleLoginBtn.textContent = "Log ind";
  }
};

// --- Registreringsmodus skift ---
registerToggleBtn.onclick = () => {
  registerMode = !registerMode;
  if (registerMode) {
    username.style.display = "block";
    loginBtn.textContent = "Registrer";
    registerToggleBtn.textContent = "Tilbage";
  } else {
    username.style.display = "none";
    loginBtn.textContent = "Log ind";
    registerToggleBtn.textContent = "Registrer";
  }
};

// --- Log ind / Registrering ---
loginBtn.onclick = async () => {
  try {
    if (registerMode) {
      const userCredential = await auth.createUserWithEmailAndPassword(email.value, password.value);
      await db.collection("users").doc(userCredential.user.email).set({
        username: username.value || email.value.split("@")[0],
        email: email.value,
        role: "pleb"
      });
      alert("Registrering fuldført!");
    } else {
      await auth.signInWithEmailAndPassword(email.value, password.value);
    }
  } catch (err) {
    alert(err.message);
  }
};

// --- Log ud ---
logoutBtn.onclick = () => auth.signOut();

// --- Auth status overvågning ---
auth.onAuthStateChanged(async (user) => {
  const disclaimerId = "plebDisclaimer";
  let disclaimer = document.getElementById(disclaimerId);
  const topnav = document.querySelector(".topnav");

  if (user) {
    const userDoc = await db.collection("users").doc(user.email).get();
    const role = userDoc.exists ? userDoc.data().role : "pleb";

    authPanel.style.display = "none";
    toggleLoginBtn.style.display = "none";
    logoutBtn.style.display = "block";

    // --- Pleb advarsel ---
    if (role === "pleb") {
      if (!disclaimer) {
        disclaimer = document.createElement("div");
        disclaimer.id = disclaimerId;
        disclaimer.textContent = "Du har ikke tilladelse til at poste. Hvis du vil poste, kontakt: szucsbalint@szucsbalint.hu";
        disclaimer.style.background = "#fff4cc";
        disclaimer.style.color = "#444";
        disclaimer.style.borderBottom = "1px solid #ddd";
        disclaimer.style.padding = "10px";
        disclaimer.style.textAlign = "center";
        disclaimer.style.fontSize = "0.9rem";
        disclaimer.style.fontFamily = "sans-serif";
        disclaimer.style.zIndex = "500";
        topnav.insertAdjacentElement("afterend", disclaimer);
      }
    } else {
      if (disclaimer) disclaimer.remove();
    }

    // --- Postpanel visning baseret på rolle ---
    if (role === "member" || role === "admin") {
      postPanel.style.display = "block";
    } else {
      postPanel.style.display = "none";
    }

  } else {
    logoutBtn.style.display = "none";
    toggleLoginBtn.style.display = "block";
    postPanel.style.display = "none";
    if (disclaimer) disclaimer.remove();
  }
});

// --- Postning ---
postBtn.onclick = async () => {
  const text = message.value.trim();
  if (!text) return;

  const user = auth.currentUser;
  if (!user) {
    alert("Log ind først!");
    return;
  }

  const userDoc = await db.collection("users").doc(user.email).get();
  const userData = userDoc.data();
  const role = userData.role || "pleb";
  const authorName = userData.username || user.email.split("@")[0];

  if (role !== "member" && role !== "admin") {
    alert("Du har ikke tilladelse til at poste.");
    return;
  }

  try {
    await db.collection("posts").add({
      text,
      author: authorName,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    message.value = "";
  } catch (err) {
    console.error("Fejl ved postning:", err);
    alert("Kunne ikke poste: " + err.message);
  }
};

// --- Sprogdetektion og automatisk oversættelse ---
async function detectAndTranslate(postElement, targetLang) {
  const text = postElement.textContent.trim();
  if (!text) return;

  try {
    const detectRes = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    );
    const data = await detectRes.json();

    const detectedLang = data[2];
    if (!detectedLang || detectedLang === targetLang) return;

    const translatedText = data[0].map(item => item[0]).join('');

    postElement.dataset.original = text;
    postElement.dataset.translated = translatedText;
    postElement.dataset.detected = detectedLang;
    postElement.textContent = translatedText;

    const info = document.createElement("div");
    info.style.fontSize = "0.8rem";
    info.style.color = "#666";
    info.textContent = `Oversat fra: ${detectedLang.toUpperCase()}`;
    
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "Vis original";
    toggleBtn.classList.add("translateToggleBtn");

    let showingOriginal = false;
    toggleBtn.onclick = () => {
      showingOriginal = !showingOriginal;
      if (showingOriginal) {
        postElement.textContent = postElement.dataset.original;
        toggleBtn.textContent = "Oversæt til engelsk";
      } else {
        postElement.textContent = postElement.dataset.translated;
        toggleBtn.textContent = "Vis original";
      }
    };

    postElement.parentElement.appendChild(info);
    postElement.parentElement.appendChild(toggleBtn);
  } catch (err) {
    console.error("Oversættelsesfejl:", err);
  }
}

// --- Visning af posts i realtid ---
db.collection("posts").orderBy("createdAt", "desc").onSnapshot(async snapshot => {
  postsContainer.innerHTML = "";
  const user = auth.currentUser;
  let role = null;

  if (user) {
    const userDoc = await db.collection("users").doc(user.email).get();
    if (userDoc.exists) role = userDoc.data().role;
  }

  const currentLang = document.documentElement.lang || "da";

  snapshot.forEach(async doc => {
    const d = doc.data();
    const date = d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleString("da-DK") : "";
    let postHTML = `
      <div class="blogPost">
        <div class="postDate">${d.author || "Ukendt"} – ${date}</div>
        <div class="postContent">${d.text || ""}</div>
    `;

    if (role === "admin") {
      postHTML += `<button class="deleteBtn" data-id="${doc.id}">Slet</button>`;
    }

    postHTML += `</div>`;
    postsContainer.innerHTML += postHTML;
  });

  // Start oversættelse efter DOM er indlæst
  setTimeout(() => {
    document.querySelectorAll(".postContent").forEach(post => {
      detectAndTranslate(post, currentLang);
    });
  }, 500);

  // --- Slet-knap ---
  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.getAttribute("data-id");
      if (confirm("Er du sikker?")) {
        await db.collection("posts").doc(id).delete();
      }
    });
  });
});
