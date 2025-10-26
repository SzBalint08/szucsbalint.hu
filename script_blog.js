// --- Mobil navigáció ---
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
const addPostBtn = document.getElementById("addPostBtn");
const blogContainer = document.getElementById("blogContainer");

let currentUser = null;
let currentRole = null;
const currentLang = (document.documentElement.lang || "hu").toLowerCase();

// --- DeepL fordítás Worker-en keresztül ---
const WORKER_URL = "https://autumn-frost-5288.mr-balint-szucs.workers.dev/";

async function translateText(text, targetLang) {
  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLang })
    });
    if (!res.ok) {
      console.error("Worker hiba:", res.status);
      return "";
    }
    const data = await res.json();
    // DeepL válasz: { translations: [ { detected_source_language: "...", text: "..." } ] }
    return data.translations?.[0]?.text || "";
  } catch (e) {
    console.error("translateText error:", e);
    return "";
  }
}

// --- Auth figyelés ---
auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  if (!user) {
    if (adminPanel) adminPanel.style.display = "none";
    currentRole = null;
    loadPostsByLang();
    return;
  }

  try {
    const userDoc = await db.collection("users").doc(user.email).get();
    currentRole = userDoc.exists ? userDoc.data().role : "pleb";
  } catch (err) {
    console.error("users doc read hiba:", err);
    currentRole = "pleb";
  }

  if (currentRole === "admin" && adminPanel) {
    adminPanel.style.display = "block";
  } else if (adminPanel) {
    adminPanel.style.display = "none";
  }

  loadPostsByLang();
});

function loadPostsByLang() {
  if (currentLang === "hu") loadPosts();
  else if (currentLang === "en") loadTranslatedPosts("en");
  else if (currentLang === "da" || currentLang === "dk") loadTranslatedPosts("da");
}

// --- Új HU poszt létrehozása ---
if (addPostBtn) {
  addPostBtn.addEventListener("click", async () => {
    const text = newPost.value.trim();
    if (!text || !currentUser || currentRole !== "admin") return;

    try {
      const postRef = await db.collection("blogPosts").add({
        text,
        author: currentUser.email,
        lang: "hu",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        translations: {}
      });

      // fordítások párhuzamosan
      const [enText, daText] = await Promise.all([
        translateText(text, "EN"),
        translateText(text, "DA")
      ]);

      await db.collection("blogPosts").doc(postRef.id).update({
        translations: {
          en: { text: enText, edited: false, editable: true },
          da: { text: daText, edited: false, editable: true }
        }
      });

      newPost.value = "";
    } catch (err) {
      console.error("Poszt létrehozási hiba:", err);
      alert("Hiba történt a poszt létrehozásakor. Nézd meg a konzolt.");
    }
  });
}

// --- HU posztok betöltése ---
function loadPosts() {
  db.collection("blogPosts")
    .where("lang", "==", "hu")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      blogContainer.innerHTML = "";
      snapshot.forEach((doc) => {
        const d = doc.data();
        const date = d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleDateString("hu-HU") : "";
        const div = document.createElement("div");
        div.className = "blogPost";
        div.innerHTML = `
          <div class="postDate">${date}</div>
          <div class="postContent">${escapeHtml(d.text)}</div>
        `;
        if (currentRole === "admin") {
          const delBtn = document.createElement("button");
          delBtn.textContent = "Törlés";
          delBtn.onclick = async () => {
            if (!confirm("Törlöd a bejegyzést?")) return;
            await db.collection("blogPosts").doc(doc.id).delete();
          };
          div.appendChild(delBtn);
        }
        blogContainer.appendChild(div);
      });
    });
}

function loadTranslatedPosts(lang) {
  lang = lang.toLowerCase(); // biztosítsuk, hogy kisbetűs legyen
  db.collection("blogPosts")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      blogContainer.innerHTML = "";
      snapshot.forEach((doc) => {
        const d = doc.data();
        if (!d.translations || !d.translations[lang]) return;

        const date = d.createdAt
          ? new Date(d.createdAt.seconds * 1000).toLocaleDateString(lang === "en" ? "en-US" : "da-DK")
          : "";

        const div = document.createElement("div");
        div.className = "blogPost";

        // Post content, CSS szabályozza a kinézetet
        div.innerHTML = `
          <div class="postDate">${date}</div>
          <div class="postContent">${escapeHtml(d.translations[lang].text)}</div>
          <div class="autoTranslation" title="Ez a szöveg automatikusan DeepL API-val lett lefordítva">
  🔄 DeepL
</div>

        `;

        // Admin szerkesztés gomb
        if (currentRole === "admin" && d.translations[lang].editable) {
          const editBtn = document.createElement("button");
          editBtn.textContent = "Szerkesztés";
          editBtn.onclick = () => openEditBox(doc.id, lang, d.translations[lang].text);
          div.appendChild(editBtn);
        }

        blogContainer.appendChild(div);
      });
    });
}


// --- In-place szerkesztő ---
function openEditBox(docId, lang, currentText) {
  const modal = document.createElement("div");
  modal.className = "editModal";
  modal.style = "position:fixed;left:0;top:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);z-index:9999;";
  modal.innerHTML = `<div class="editBox" style="background:#fff;padding:1rem;border-radius:6px;max-width:90%;width:600px;">
      <textarea id="editText" style="width:100%;height:200px;">${escapeHtml(currentText)}</textarea>
      <div style="margin-top:.5rem;display:flex;gap:.5rem;justify-content:flex-end;">
        <button id="saveEdit">Mentés</button>
        <button id="cancelEdit">Mégse</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  document.getElementById("saveEdit").onclick = async () => {
    const newText = document.getElementById("editText").value.trim();
    if (newText) {
      const update = {};
      update[`translations.${lang}.text`] = newText;
      update[`translations.${lang}.edited`] = true;
      try {
        await db.collection("blogPosts").doc(docId).update(update);
      } catch (err) {
        console.error("Szerkesztés mentés hiba:", err);
        alert("Nem sikerült menteni a szerkesztést.");
      }
    }
    modal.remove();
  };

  document.getElementById("cancelEdit").onclick = () => modal.remove();
}

// --- segédfüggvény ---
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
