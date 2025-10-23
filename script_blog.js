function myFunction() {
  const x = document.getElementById("myTopnav");
  if (x.className === "topnav") x.className += " responsive";
  else x.className = "topnav";
}

// --- Firebase config ---
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

const adminPanel = document.getElementById("adminPanel");
const newPost = document.getElementById("newPost");
const langSelect = document.getElementById("langSelect");
const addPostBtn = document.getElementById("addPostBtn");
const blogContainer = document.getElementById("blogContainer");

let currentRole = null;
let currentUser = null;
const currentLang = document.documentElement.lang || "hu";

// --- DeepL fordító függvény ---
async function translateText(text, targetLang) {
  const res = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      "Authorization": "DeepL-Auth-Key 81be3354-5798-4122-b0a3-e4582b4a2e1c:fx", // ide jön a kulcs
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      text: text,
      target_lang: targetLang
    })
  });
  const data = await res.json();
  return data.translations[0].text;
}

// --- Auth figyelése ---
auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  if (user) {
    const userDoc = await db.collection("users").doc(user.email).get();
    currentRole = userDoc.exists ? userDoc.data().role : "pleb";

    if (currentRole === "admin") adminPanel.style.display = "block";
    else adminPanel.style.display = "none";
  } else {
    adminPanel.style.display = "none";
    currentRole = null;
  }

  // Oldal betöltése a nyelvtől függően
  if (currentLang === "hu") loadPosts();
  else if (currentLang === "en") loadTranslatedPosts('en');
  else if (currentLang === "dk") loadTranslatedPosts('dk');
});

// --- Új HU bejegyzés létrehozása + DeepL fordítás ---
addPostBtn.onclick = async () => {
  const text = newPost.value.trim();
  if (!text || !currentUser || currentRole !== "admin") return;

  // Magyar poszt létrehozása
  const postRef = await db.collection("blogPosts").add({
    text,
    author: currentUser.email,
    lang: "hu",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    translations: {}
  });

  // DeepL fordítások EN és DK nyelvre
  const enText = await translateText(text, "EN");
  const dkText = await translateText(text, "DA");

  await postRef.update({
    translations: {
      en: { text: enText, editable: true },
      dk: { text: dkText, editable: true }
    }
  });

  newPost.value = "";
};

// --- HU posztok betöltése ---
function loadPosts() {
  db.collection("blogPosts")
    .where("lang", "==", "hu")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      blogContainer.innerHTML = "";
      snapshot.forEach(doc => {
        const d = doc.data();
        const date = d.createdAt
          ? new Date(d.createdAt.seconds * 1000).toLocaleDateString("hu-HU")
          : "";

        const div = document.createElement("div");
        div.className = "blogPost";
        div.innerHTML = `
          <div class="postDate">${date}</div>
          <div class="postContent">${d.text}</div>
        `;

        if (currentRole === "admin") {
          const delBtn = document.createElement("button");
          delBtn.textContent = "Törlés";
          delBtn.onclick = async () => {
            await db.collection("blogPosts").doc(doc.id).delete();
          };
          div.appendChild(delBtn);
        }

        blogContainer.appendChild(div);
      });
    });
}

// --- EN / DK fordított posztok betöltése ---
function loadTranslatedPosts(lang) {
  db.collection("blogPosts")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      blogContainer.innerHTML = "";
      snapshot.forEach(doc => {
        const d = doc.data();
        if (!d.translations || !d.translations[lang]) return;

        const div = document.createElement("div");
        div.className = "blogPost";

        div.innerHTML = `
          <div class="postDate">${d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleDateString(lang) : ""}</div>
          <div class="postContent">${d.translations[lang].text}</div>
        `;

        // Admin szerkesztés
        if (currentRole === "admin" && d.translations[lang].editable) {
          const editBtn = document.createElement("button");
          editBtn.textContent = "Szerkesztés";
          editBtn.onclick = async () => {
            const newText = prompt("Szerkeszd a posztot:", d.translations[lang].text);
            if (newText) {
              const update = {};
              update[`translations.${lang}.text`] = newText;
              await db.collection("blogPosts").doc(doc.id).update(update);
            }
          };
          div.appendChild(editBtn);
        }

        blogContainer.appendChild(div);
      });
    });
}
