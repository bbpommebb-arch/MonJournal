const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", () => {
  const adminBtn = document.getElementById("adminBtn");
  const loginPopup = document.getElementById("loginPopup");
  const closeLogin = document.getElementById("closeLogin");
  const loginBtn = document.getElementById("loginBtn");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const journalContent = document.getElementById("journalContent");
  const lockedMessage = document.getElementById("lockedMessage");

  const newTitle = document.getElementById("newTitle");
  const newContent = document.getElementById("newContent");
  const newTags = document.getElementById("newTags");
  const addEntryBtn = document.getElementById("addEntryBtn");
  const clearFilters = document.getElementById("clearFilters");

  const searchDate = document.getElementById("searchDate");
  const searchText = document.getElementById("searchText");
  const searchBtn = document.getElementById("searchBtn");

  const entriesDiv = document.getElementById("entries");
  const allTagsDiv = document.getElementById("allTags");

  const darkToggle = document.getElementById("darkToggle");

  let calendar;
  let allEntries = [];
  let currentFilter = { date:null, text:"", tag:null };

  // Dark mode
  const savedDark = localStorage.getItem("journal-dark") === "1";
  if(savedDark) document.body.classList.add("dark");
  darkToggle.textContent = savedDark ? "☀️" : "🌙";
  darkToggle.addEventListener("click", () => {
    const dark = document.body.classList.toggle("dark");
    localStorage.setItem("journal-dark", dark ? "1":"0");
    darkToggle.textContent = dark ? "☀️":"🌙";
  });

  // Admin login
  adminBtn.addEventListener("click", ()=>{loginPopup.style.display="flex"});
  closeLogin.addEventListener("click", ()=>{loginPopup.style.display="none"});
  loginBtn.addEventListener("click", ()=>{
    const email = emailInput.value.trim();
    const pwd = passwordInput.value.trim();
    if(!email||!pwd){ alert("Email et mot de passe requis"); return;}
    auth.signInWithEmailAndPassword(email,pwd).then(()=>{loginPopup.style.display="none"}).catch(e=>alert(e.message));
  });

  auth.onAuthStateChanged(user=>{
    if(user){
      lockedMessage.style.display="none";
      journalContent.style.display="block";
      activateEditing();
      startRealtime();
    }else{
      journalContent.style.display="none";
      lockedMessage.style.display="block";
      disableEditing();
    }
  });

	function initCalendar(){
		const calendarEl = document.getElementById('calendar');
		calendar = new FullCalendar.Calendar(calendarEl, {
		  initialView: 'dayGridMonth'
		});
		calendar.render();
	}
  initCalendar();

  function startRealtime(){
    db.collection("entries").orderBy("date","desc").onSnapshot(snapshot=>{
      allEntries = snapshot.docs.map(d=>({id:d.id,data:d.data()}));
      allEntries.forEach(e=>{
        if(e.data.date && typeof e.data.date!=="string" && e.data.date.toDate) e.data.date=e.data.date.toDate().toISOString();
      });
      updateUIFromEntries();
    });
  }

  function updateUIFromEntries(){
    calendar.removeAllEvents();
    const events = allEntries.map(e=>({title:e.data.title||"•", start:e.data.date.slice(0,10)}));
    events.forEach(ev=>calendar.addEvent(ev));

    const tagSet = new Set();
    allEntries.forEach(e=>{ (e.data.tags||[]).forEach(t=>tagSet.add(t)); });
    renderAllTags(Array.from(tagSet).sort());

    renderEntries();
  }

  function renderAllTags(tags){
    allTagsDiv.innerHTML="";
    tags.forEach(t=>{
      const btn=document.createElement("button");
      btn.className="tag";
      btn.textContent=t;
      btn.addEventListener("click", ()=>{
        currentFilter.tag=t;
        renderEntries();
      });
      allTagsDiv.appendChild(btn);
    });
  }

  function renderEntries(){
    entriesDiv.innerHTML="";
    const fDate=currentFilter.date;
    const fText=(currentFilter.text||"").toLowerCase();
    const fTag=currentFilter.tag;

    const filtered = allEntries.filter(e=>{
      const dISO = e.data.date.slice(0,10);
      if(fDate && dISO!==fDate) return false;
      if(fTag && !(e.data.tags||[]).some(t=>t.toLowerCase()===fTag.toLowerCase())) return false;
      if(fText && !(e.data.title+" "+e.data.content+" "+(e.data.tags||[]).join(" ")).toLowerCase().includes(fText)) return false;
      return true;
    });

    if(filtered.length===0){ entriesDiv.innerHTML="<div>Aucune entrée</div>"; return;}

    filtered.forEach(e=>{
      const div=document.createElement("div"); div.className="entry";
      const dateStr = new Date(e.data.date).toLocaleString();
      const tagsHtml=(e.data.tags||[]).map(t=>`<span class="tag">${t}</span>`).join(" ");
      div.innerHTML=`
        <div class="meta"><div class="title">${e.data.title}</div><div class="date">${dateStr}</div></div>
        <p>${e.data.content}</p>
        <div class="entry-tags">${tagsHtml}</div>
      `;
      entriesDiv.appendChild(div);
    });
  }

  addEntryBtn.addEventListener("click", ()=>{
    if(!auth.currentUser){alert("Tu dois être connecté."); return;}
    const title = newTitle.value.trim();
    const content = newContent.value.trim();
    const tags = (newTags.value||"").split(",").map(t=>t.trim()).filter(Boolean);
    if(!title&&!content){ alert("Titre ou contenu requis"); return; }
    db.collection("entries").add({
      title:title||"(sans titre)",
      content:content||"",
      tags,
      date:new Date().toISOString()
    }).then(()=>{
      newTitle.value=""; newContent.value=""; newTags.value="";
      currentFilter={date:null,text:"",tag:null};
      searchDate.value=""; searchText.value="";
    });
  });

  function activateEditing(){ addEntryBtn.disabled=false; }
  function disableEditing(){ addEntryBtn.disabled=true; }

});
