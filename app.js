// 🔹 Config Firebase
const firebaseConfig = {
  apiKey: "TON_API_KEY",
  authDomain: "TON_PROJECT_ID.firebaseapp.com",
  projectId: "TON_PROJECT_ID",
  storageBucket: "TON_PROJECT_ID.appspot.com",
  messagingSenderId: "TON_SENDER_ID",
  appId: "TON_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// 🔹 Références HTML
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userNameSpan = document.getElementById('userName');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const tagsInput = document.getElementById('tags');
const saveBtn = document.getElementById('saveBtn');
const entriesDiv = document.getElementById('entries');
const filterTagInput = document.getElementById('filterTag');

let currentUser = null;
let entriesData = [];

// 🔹 Authentification Google
const provider = new firebase.auth.GoogleAuthProvider();

loginBtn.addEventListener('click', () => auth.signInWithPopup(provider));
logoutBtn.addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged(user => {
  currentUser = user;
  if(user){
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline';
    userNameSpan.textContent = `Bonjour, ${user.displayName}`;
    listenEntries();
  } else {
    loginBtn.style.display = 'inline';
    logoutBtn.style.display = 'none';
    userNameSpan.textContent = '';
    entriesDiv.innerHTML = '';
    document.getElementById('calendar').innerHTML = '';
  }
});

// 🔹 Ajouter une entrée
saveBtn.addEventListener('click', () => {
  if(!currentUser){ alert("Connectez-vous pour enregistrer une entrée !"); return; }

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
  if (!title && !content) return;

  db.collection('entries').add({
    title,
    content,
    tags,
    date: new Date(),
    userId: currentUser.uid
  }).then(() => {
    titleInput.value = '';
    contentInput.value = '';
    tagsInput.value = '';
  });
});

// 🔹 Écoute temps réel des entrées
function listenEntries(){
  db.collection('entries')
    .where('userId', '==', currentUser.uid)
    .orderBy('date', 'desc')
    .onSnapshot(snapshot => {
      entriesData = snapshot.docs;
      renderEntries();
    });
}

// 🔹 Afficher et filtrer les entrées
function renderEntries(){
  const filterTag = filterTagInput.value.trim().toLowerCase();
  entriesDiv.innerHTML = '';
  let events = [];

  entriesData.forEach(doc => {
    const entry = doc.data();
    if(filterTag && !entry.tags.some(t => t.toLowerCase().includes(filterTag))) return;

    const div = document.createElement('div');
    div.innerHTML = `
      <h3>${entry.title}</h3>
      <p>${entry.content}</p>
      <small>${entry.tags.join(', ')}</small>
      <small>${entry.date.toDate().toLocaleString()}</small>
      <br>
      <button class="editBtn">Modifier</button>
      <button class="deleteBtn">Supprimer</button>
    `;

    // Modifier
    div.querySelector('.editBtn').addEventListener('click', () => {
      const newTitle = prompt("Nouveau titre :", entry.title);
      const newContent = prompt("Nouveau contenu :", entry.content);
      const newTags = prompt("Nouveaux tags (virgule séparés) :", entry.tags.join(','));
      if(newTitle !== null && newContent !== null){
        doc.ref.update({
          title: newTitle,
          content: newContent,
          tags: newTags.split(',').map(t => t.trim())
        });
      }
    });

    // Supprimer
    div.querySelector('.deleteBtn').addEventListener('click', () => {
      if(confirm("Supprimer cette entrée ?")) doc.ref.delete();
    });

    entriesDiv.appendChild(div);

    events.push({
      title: entry.title,
      start: entry.date.toDate()
    });
  });

  // Calendrier
  const calendarEl = document.getElementById('calendar');
  calendarEl.innerHTML = '';
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    events
  });
  calendar.render();
}

filterTagInput.addEventListener('input', renderEntries);
