// Mobil menü (ugyanaz, mint a többi oldalad)
function myFunction() {
    const x = document.getElementById("myTopnav");
    if (x.className === "topnav") x.className += " responsive";
    else x.className = "topnav";
  }
  
  // DOM elemek
  const messagesDiv = document.getElementById("messages");
  const chatForm = document.getElementById("chatForm");
  const inputMsg = document.getElementById("inputMsg");
  
  // 🚨 CSERÉLD KI EZT AZ URL-T A SAJÁT WORKERED CÍMÉRE!
  const WORKER_URL = "https://rough-mud-a221.mr-balint-szucs.workers.dev";
  
  // Üzenet hozzáadása a chathez
  function appendMessage(text, who) {
    const el = document.createElement("div");
    el.className = "msg " + (who === "user" ? "user" : "bot");
    el.textContent = text;
    messagesDiv.appendChild(el);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
  // Ide beillesztjük a nyelvi kódot az adott oldalhoz:
  const CURRENT_LANGUAGE = 'dk'; // DK

  // ... (DOM elemek, appendMessage változatlan) ...
      
      // Chat elküldése a Worker-nek (itt már a válasz egy sima szöveg, nem bonyolult JSON)
      async function queryWorker(userText) {
        const payload = {
          // Ezt az objektumot küldi a kliens a Worker-nek
          userText: userText,
          language: CURRENT_LANGUAGE 
        };
  
    const resp = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Worker hiba: ${resp.status} - ${txt}`);
    }
  
    // 💡 Itt a Worker által visszaküldött TISZTA szöveget fogadjuk
    const reply = await resp.text(); 
    return reply;
  }
  
  // Form kezelése
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = inputMsg.value.trim();
    if (!text) return;
  
    appendMessage(text, "user");
    inputMsg.value = "";
    inputMsg.disabled = true;
    document.getElementById("sendBtn").disabled = true;
  
    const loadingEl = document.createElement("div");
    loadingEl.className = "msg bot";
    loadingEl.textContent = "...";
    messagesDiv.appendChild(loadingEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  
    try {
      const reply = await queryWorker(text);
      loadingEl.remove();
      appendMessage(reply, "bot");
    } catch (err) {
      loadingEl.remove();
      appendMessage("Hiba történt: " + err.message, "bot");
      console.error(err);
    } finally {
      inputMsg.disabled = false;
      document.getElementById("sendBtn").disabled = false;
      inputMsg.focus();
    }
  });