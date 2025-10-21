function myFunction() {
  var x = document.getElementById("myTopnav");
  if (x.className === "topnav") x.className += " responsive";
  else x.className = "topnav";
}

// Firebase config
const firebaseConfig = {
  apiKey: "ÚJ_API_KEY",
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

// HTML elemek
const adminPanel = document.getElementById("adminPanel");
const newPost = document.getElementById("newPost");
const langSelect = document.getElementById("langSelect");
const addPostBtn = document.getElementById("addPostBtn");
const blogContainer = document.getElementById("blogContainer");

let currentRole = null;
let currentUser = null;
const currentLang = document.documentElement.lang || "hu";

// --- Bejelentkezés figyelése ---
auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  if (user) {
    // Lekérdezzük a role-t
    const userDoc = await db.collection("users").doc(user.email).get();
    currentRole = userDoc.exists ? userDoc.data().role : "member";

    if (currentRole === "admin") adminPanel.style.display = "block";
    else adminPanel.style.display = "none";
  } else {
    adminPanel.style.display = "none";
    currentRole = null;
  }

  loadPosts();
});

// --- Új bejegyzés hozzáadása ---
addPostBtn.onclick = async () => {
  const text = newPost.value.trim();
  if (!text || !currentUser || currentRole !== "admin") return;

  await db.collection("blogPosts").add({
    text,
    author: currentUser.email,
    lang: langSelect.value,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  newPost.value = "";
};

// --- Blog posztok betöltése ---
function loadPosts() {
  db.collection("blogPosts")
    .where("lang", "==", currentLang)
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      blogContainer.innerHTML = "";
      snapshot.forEach(doc => {
        const d = doc.data();
        const date = d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleString() : "";
        const div = document.createElement("div");
        div.className = "blogPost";
        div.innerHTML = `
          <div class="postDate">${d.author} – ${date}</div>
          <div class="postContent">${d.text}</div>
        `;

        // Admin törlés gomb
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
