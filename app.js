<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Journal Privé</title>

<!-- FullCalendar 5 (stable pour script global) -->
<link href="https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/main.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/main.min.js"></script>

<!-- Firebase -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>

<style>
body{font-family:Segoe UI, Arial, sans-serif; margin:0; padding:2em; background:#f6f7fb; color:#0f1724;}
body.dark{background:#0b1220; color:#e6eef8;}
button{cursor:pointer; margin:4px; padding:6px 12px; border-radius:8px;}
.panel{background:white; padding:12px; border-radius:12px; margin-bottom:12px;}
.layout{display:flex; gap:16px; flex-wrap:wrap;}
.layout > div{flex:1 1 360px;}
#calendar{background:white; border-radius:12px; padding:8px;}
.entry{border:1px solid #ddd; border-radius:8px; padding:10px; margin-bottom:10px;}
.entry .meta{display:flex; justify-content:space-between; margin-bottom:6px;}
.entry-tags{display:flex; gap:6px; flex-wrap:wrap;}
.tag{background:rgba(37,99,235,0.08); color:#2563eb; padding:4px 8px; border-radius:999px; font-size:0.85rem; cursor:pointer;}
body.dark .tag{background: rgba(96,165,250,0.08);}
</style>
</head>
<body>

<button id="adminBtn">Admin</button>
<button id="darkToggle">🌙</button>

<div id="lockedMessage" class="panel">
  <p>Ce journal est privé. Cliquez sur Admin pour vous connecter.</p>
</div>

<div id="journalContent" style="display:none;">

  <div class="layout">
    <div>
      <div class="panel">
        <h3>Nouvelle entrée</h3>
        <input id="newTitle" placeholder="Titre"><br>
        <textarea id="newContent" placeholder="Texte"></textarea><br>
        <input id="newTags" placeholder="Tags (séparés par virgule)"><br>
        <button id="addEntryBtn">Ajouter</button>
        <button id="clearFilters">Réinitialiser filtres</button>
      </div>

      <div class="panel">
        <h3>Calendrier</h3>
        <div id="calendar"></div>
      </div>
    </div>

    <div>
      <div class="panel">
        <input id="searchDate" type="date">
        <input id="searchText" placeholder="Rechercher...">
        <button id="searchBtn">Rechercher</button>
        <div id="allTags" class="tags-row" style="margin-top:8px;"></div>
        <div id="entries"></div>
      </div>
    </div>
  </div>
</div>

<!-- Login popup -->
<div id="loginPopup" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.4); justify-content:center; align-items:center;">
  <div style="background:white; padding:18px; border-radius:12px; width:360px;">
    <h3>Connexion</h3>
    <input id="email" type="email" placeholder="Email"><br>
    <input id="password" type="password" placeholder="Mot de passe"><br>
    <button id="loginBtn">Se connecter</button>
    <button id="closeLogin">Fermer</button>
  </div>
</div>

<!-- App script -->
<script>
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
</script>
<script src="app.js"></script>

</body>
</html>
