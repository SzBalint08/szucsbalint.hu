// --- Navigációs menü mobilon ---
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
  
  // Elemeink
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
  
  // Panel megjelenítése
  let registerMode = false;
  toggleLoginBtn.onclick = () => {
    authPanel.style.display = authPanel.style.display === "none" || authPanel.style.display === "" ? "block" : "none";
    toggleLoginBtn.textContent = authPanel.style.display === "block" ? "Bezárás" : "Bejelentkezés";
  };
  
  // Regisztráció mód
  registerToggleBtn.onclick = () => {
    registerMode = !registerMode;
    username.style.display = registerMode ? "block" : "none";
    loginBtn.textContent = registerMode ? "Regisztráció" : "Bejelentkezés";
    registerToggleBtn.textContent = registerMode ? "Mégse" : "Regisztráció";
  };
  
  // Bejelentkezés / Regisztráció
  loginBtn.onclick = async () => {
    try {
      if (registerMode) {
        const userCredential = await auth.createUserWithEmailAndPassword(email.value, password.value);
        await db.collection("users").doc(userCredential.user.email).set({
          username: username.value || email.value.split("@")[0],
          email: email.value,
          role: "member" // alapértelmezett role
        });
        alert("Sikeres regisztráció!");
      } else {
        await auth.signInWithEmailAndPassword(email.value, password.value);
      }
    } catch (err) {
      alert(err.message);
    }
  };
  
  // Kijelentkezés
  logoutBtn.onclick = () => auth.signOut();
  
  // Auth figyelése
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      authPanel.style.display = "none";
      toggleLoginBtn.style.display = "none";
      logoutBtn.style.display = "block";
      postPanel.style.display = "block";
  
      // Szerepkör lekérdezés
      const userDoc = await db.collection("users").doc(user.email).get();
      window.currentRole = userDoc.exists ? userDoc.data().role : "member";
    } else {
      logoutBtn.style.display = "none";
      toggleLoginBtn.style.display = "block";
      postPanel.style.display = "none";
      window.currentRole = null;
    }
  });
  
  // Posztolás
  postBtn.onclick = async () => {
    const text = message.value.trim();
    if (!text || !auth.currentUser) return alert("Előbb jelentkezz be!");
  
    const userDoc = await db.collection("users").doc(auth.currentUser.email).get();
    const uname = userDoc.exists ? userDoc.data().username : auth.currentUser.email;
    const role = userDoc.exists ? userDoc.data().role : "member";
  
    await db.collection("posts").add({
      text,
      author: uname,
      role,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    message.value = "";
  };
  
  // Posztok megjelenítése + törlés adminnak
  db.collection("posts").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    postsContainer.innerHTML = "";
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
      if (window.currentRole === "admin") {
        const delBtn = document.createElement("button");
        delBtn.textContent = "Törlés";
        delBtn.onclick = async () => {
          await db.collection("posts").doc(doc.id).delete();
        };
        div.appendChild(delBtn);
      }
  
      postsContainer.appendChild(div);
    });
  });
  