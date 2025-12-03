(() => {
    const firebaseConfig = {
      apiKey: "AIzaSyC5PGp0CIL-NGzv0bh3EEfdr4JjHjBp4FE",
      authDomain: "szucsbalinthu.firebaseapp.com",
      projectId: "szucsbalinthu",
      storageBucket: "szucsbalinthu.firebasestorage.app",
      messagingSenderId: "226319656079",
      appId: "1:226319656079:web:d86b6062d0fd4b6499bcfa",
      measurementId: "G-F5GPHLJS9Y"
    };
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
  
    const newProjBtn = document.getElementById("newProjBtn");
    const projectsList = document.getElementById("projectsList");
    const docTitle = document.getElementById("docTitle");
    const editorTA = document.getElementById("editor");
    const saveBtn = document.getElementById("saveBtn");
    const compileBtn = document.getElementById("compileBtn");
    const pdfBtn = document.getElementById("pdfBtn");
    const inviteBtn = document.getElementById("inviteBtn");
    const inviteEmail = document.getElementById("inviteEmail");
    const collabsDiv = document.getElementById("collabs");
    const previewDiv = document.getElementById("latex-preview");
    const compileLog = document.getElementById("compileLog");
    const toggleProjectsBtn = document.getElementById("toggleProjects");
  
    let cmEditor = CodeMirror.fromTextArea(editorTA, {mode:"stex",lineNumbers:true,matchBrackets:true,indentUnit:2,theme:"default"});
    let currentDocId=null;
    let unsubscribeRealtime=null;
    let projectsVisible=true;
  
    // Toggle projektek listája
    toggleProjectsBtn.onclick = () => {
      projectsVisible=!projectsVisible;
      projectsList.style.display = projectsVisible ? "flex":"none";
      toggleProjectsBtn.textContent = projectsVisible ? "Összecsukás":"Kinyitás";
    }
  
    async function ensureLoggedIn() {
      return new Promise((resolve)=>{
        auth.onAuthStateChanged(user=>{
          if(user) resolve(user);
          else{
            const email=prompt("Email:");
            const pass=prompt("Jelszó:");
            if(!email){alert("Bejelentkezés szükséges."); resolve(null); return;}
            auth.signInWithEmailAndPassword(email,pass).then(u=>resolve(u.user)).catch(err=>{alert(err.message); resolve(null);});
          }
        });
      });
    }
  
    newProjBtn.onclick=async()=>{
      const user=auth.currentUser;
      if(!user){alert("Előbb jelentkezz be.");return;}
      const title=docTitle.value.trim()||("Dokumentum - "+new Date().toLocaleString());
      try{
        const ref=await db.collection("latexDocs").add({
          title,
          content:"% Kezdj el írni...\n\\documentclass{article}\n\\begin{document}\nHello world!\n\\end{document}",
          owner:user.email,
          collaborators:[user.email],
          createdAt:firebase.firestore.FieldValue.serverTimestamp()
        });
        docTitle.value="";
        loadProjectList();
        openProject(ref.id);
      }catch(err){console.error(err);alert(err.message);}
    }
  
    async function loadProjectList(){
      projectsList.innerHTML="Betöltés...";
      const user=auth.currentUser;
      if(!user){projectsList.innerHTML="Jelentkezz be."; return;}
      try{
        const email=user.email;
        const snap=await db.collection("latexDocs").where("collaborators","array-contains",email).get();
        projectsList.innerHTML="";
        snap.forEach(d=>{
          const data=d.data();
          const el=document.createElement("div");
          el.className="project-item";
          el.innerHTML=`<div><strong>${escapeHtml(data.title)}</strong> <div style="font-size:0.8rem;color:#666">${escapeHtml(data.owner)}</div></div>`;
          const openBtn=document.createElement("button"); openBtn.className="btn ghost"; openBtn.textContent="Megnyitás";
          openBtn.onclick=()=>openProject(d.id); el.appendChild(openBtn);
          const delBtn=document.createElement("button"); delBtn.className="btn"; delBtn.style.background="#e53935"; delBtn.textContent="Törlés";
          delBtn.onclick=async()=>{
            if(!confirm("Biztos vagy benne, hogy törlöd?")) return;
            if(data.owner!==auth.currentUser.email){alert("Csak a tulajdonos törölheti."); return;}
            await db.collection("latexDocs").doc(d.id).delete();
            if(currentDocId===d.id){closeProject();}
            loadProjectList();
          }
          el.appendChild(delBtn);
          projectsList.appendChild(el);
        });
        if(projectsList.innerHTML==="") projectsList.innerHTML="<div>Nem található dokumentum.</div>";
      }catch(err){console.error(err); projectsList.innerHTML="Hiba: "+err.message;}
    }
  
    async function openProject(docId){
      if(unsubscribeRealtime) unsubscribeRealtime();
      currentDocId=docId;
      compileLog.textContent="Megnyitás...";
      const ref=db.collection("latexDocs").doc(docId);
      unsubscribeRealtime=ref.onSnapshot(snap=>{
        if(!snap.exists){compileLog.textContent="Dokumentum nem található."; return;}
        const data=snap.data();
        docTitle.value=data.title||"";
        collabsDiv.textContent="Szerkesztők: "+(data.collaborators||[]).join(", ");
        const remote=data.content||"";
        const local=cmEditor.getValue();
        if(remote!==local){const cursor=cmEditor.getCursor(); cmEditor.setValue(remote); try{cmEditor.setCursor(cursor);}catch{}}
        compileLog.textContent="Dokumentum betöltve.";
        renderPreview();
      });
    }
  
    let saveTimer=null;
    cmEditor.on("change",()=>{
      if(!currentDocId) return;
      if(saveTimer) clearTimeout(saveTimer);
      saveTimer=setTimeout(async()=>{
        try{
          await db.collection("latexDocs").doc(currentDocId).update({content:cmEditor.getValue(), updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
        }catch(err){console.error(err);}
      },700);
    });
  
    saveBtn.onclick=async()=>{
      if(!currentDocId){alert("Nyiss meg egy dokumentumot előbb!"); return;}
      try{
        await db.collection("latexDocs").doc(currentDocId).update({title:docTitle.value||"Dokumentum", updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
        alert("Mentve."); loadProjectList();
      }catch(err){alert(err.message);}
    }
  
    compileBtn.onclick=renderPreview;
    function renderPreview(){
      try{
        const parser=new latexjs.Parser();
        const doc=parser.parse(cmEditor.getValue());
        previewDiv.innerHTML="";
        previewDiv.appendChild(doc.htmlDocument());
        compileLog.textContent="Előnézet frissítve.";
      }catch(err){s
        previewDiv.innerHTML=`<pre style="color:red;">Hiba:\n${escapeHtml(err)}</pre>`;
        compileLog.textContent="Parse hiba";
      }
    }
  
    pdfBtn.onclick=async()=>{
      compileLog.textContent="PDF export...";
      try{
        const canvas=await html2canvas(previewDiv,{scale:2, useCORS:true});
        const imgData=canvas.toDataURL("image/png");
        const pdf=new jspdf.jsPDF({unit:"mm", format:"a4"});
        const pageWidth=210, pageHeight=297;
        const imgWidth=pageWidth, imgHeight=canvas.height*(imgWidth/canvas.width);
        let position=0, heightLeft=imgHeight-pageHeight;
        pdf.addImage(imgData,"PNG",0,position,imgWidth,imgHeight);
        while(heightLeft>0){pdf.addPage(); position=heightLeft*-1; pdf.addImage(imgData,"PNG",0,position,imgWidth,imgHeight); heightLeft-=pageHeight;}
        pdf.save((docTitle.value||"latex_doc").replace(/\s+/g,"_")+".pdf");
        compileLog.textContent="PDF kész.";
      }catch(err){console.error(err); compileLog.textContent="PDF hiba: "+err; alert("PDF hiba: "+err);}
    }
  
    inviteBtn.onclick=async()=>{
      if(!currentDocId){alert("Nyiss meg egy dokumentumot előbb!"); return;}
      const email=(inviteEmail.value||"").trim();
      if(!email) return alert("Adj meg egy e-mailt.");
      try{
        await db.collection("latexDocs").doc(currentDocId).update({collaborators:firebase.firestore.FieldValue.arrayUnion(email)});
        inviteEmail.value=""; compileLog.textContent="Meghívás elküldve: "+email;
      }catch(err){alert(err);}
    }
  
    function closeProject(){if(unsubscribeRealtime) unsubscribeRealtime(); unsubscribeRealtime=null; currentDocId=null; cmEditor.setValue(""); docTitle.value=""; collabsDiv.textContent=""; previewDiv.innerHTML="";}
  
    function escapeHtml(s){return String(s||"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  
    (async function init(){
      const user=await ensureLoggedIn();
      if(!user){compileLog.textContent="Nincs bejelentkezve."; return;}
      compileLog.textContent="Bejelentkezve: "+user.email;
      await loadProjectList();
    })();
  
    auth.onAuthStateChanged(user=>{
      if(!user){if(unsubscribeRealtime)unsubscribeRealtime(); projectsList.innerHTML="Jelentkezz be."; previewDiv.innerHTML="Be kell jelentkezni.";}
      else loadProjectList();
    });
  
  })();
  