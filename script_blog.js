// --- Mobilmenü ---
function myFunction() {
  var x = document.getElementById("myTopnav");
  if (x.className === "topnav") {
    x.className += " responsive";
  } else {
    x.className = "topnav";
  }
}

// --- Firebase inicializálás ---
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
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const addPostBtn = document.getElementById("addPostBtn");
const blogContainer = document.getElementById("blogContainer");

// --- Admin bejelentkezés kezelése role alapján ---
auth.onAuthStateChanged(async user => {
  if (user) {
    const userDoc = await db.collection("users").doc(user.email).get();
    if (userDoc.exists && userDoc.data().role === "admin") {
      adminPanel.style.display = "block";
    } else {
      adminPanel.style.display = "none";
    }
  } else {
    adminPanel.style.display = "none";
  }
});

// --- Blogposzt hozzáadása adminnak ---
addPostBtn.onclick = async () => {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title || !content) {
    alert("Adj meg címet és tartalmat!");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert("Nincs bejelentkezve!");
    return;
  }

  const userDoc = await db.collection("users").doc(user.email).get();
  if (!userDoc.exists || userDoc.data().role !== "admin") {
    alert("Nincs jogosultságod bejegyzést létrehozni!");
    return;
  }

  await db.collection("blogPosts").add({
    title,
    content,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  titleInput.value = "";
  contentInput.value = "";
};

// --- Blogposztok megjelenítése ---
db.collection("blogPosts").orderBy("createdAt", "desc").onSnapshot(snapshot => {
  blogContainer.innerHTML = "";

  snapshot.forEach(doc => {
    const d = doc.data();
    const date = d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleString() : "";

    let postHTML = `
      <div class="blogPost">
        <div class="postDate">${date}</div>
        <div class="postTitle"><strong>${d.title}</strong></div>
        <div class="postContent">${d.content}</div>
      </div>
    `;

    blogContainer.innerHTML += postHTML;
  });
});
