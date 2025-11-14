document.addEventListener("DOMContentLoaded", function() {

  // 🔹 Config Firebase
 const firebaseConfig = {
  apiKey: "AIzaSyB-DfZugoODC32gUqZH8lU6IJ2Kq2MSGng",
  authDomain: "mon-journal-d5e59.firebaseapp.com",
  projectId: "mon-journal-d5e59",
  storageBucket: "mon-journal-d5e59.firebasestorage.app",
  messagingSenderId: "695080304385",
  appId: "1:695080304385:web:8b0beb7d3f314a2ffe2500",
  measurementId: "G-5RXVSVPHM9"
 };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();

  let currentUser = null;
  //let entriesData = [];
  
    // 🔥 Connexion automatique anonyme
  auth.signInAnonymously()
    .then(() => {
      console.log("Connecté anonymement !");
    })
    .catch((error) => {
      console.error("Erreur lors de la connexion anonyme :", error);
    });

  // 🔥 À chaque changement d’état (connexion réussie)
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      console.log("UID anonyme =", user.uid);

      // 👉 IMPORTANT : appeler ici ta fonction de lecture Firestore
      listenEntries();
    }
  });

  // 🔥 Connexion automatique anonyme
  auth.signInAnonymously()
    .then(() => {
      console.log("Connecté anonymement !");
    })
    .catch((error) => {
      console.error("Erreur lors de la connexion anonyme :", error);
    });

  // 🔥 À chaque changement d’état (connexion réussie)
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      console.log("UID anonyme =", user.uid);

      // 👉 IMPORTANT : appeler ici ta fonction de lecture Firestore
      listenEntries();
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
    calendarEl.innerHTML = '';
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      events
    });
    calendar.render();
  }

  filterTagInput.addEventListener('input', renderEntries);

}); // Fin DOMContentLoaded
