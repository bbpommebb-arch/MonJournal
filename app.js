// Initialiser Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// Variables globales
let allEntries = [];
let currentFilter = { date: null, text: "", tag: null };
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// --- Éléments DOM ---
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
const calendarDays = document.getElementById("calendarDays");
const monthYear = document.getElementById("monthYear");
const entriesList = document.getElementById("entriesList");
const selectedDate = document.getElementById("selectedDate");

// --- Dark Mode ---
const savedDark = localStorage.getItem("journal-dark") === "1";
if (savedDark) document.body.classList.add("dark");
darkToggle.textContent = savedDark ? "☀️" : "🌙";

darkToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("journal-dark", isDark ? "1" : "0");
  darkToggle.textContent = isDark ? "☀️" : "🌙";
});

// --- Admin Login ---
adminBtn.addEventListener("click", () => {
  loginPopup.style.display = "flex";
});

closeLogin.addEventListener("click", () => {
  loginPopup.style.display = "none";
});

loginBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const pwd = passwordInput.value.trim();
  if (!email || !pwd) {
    alert("Email et mot de passe requis");
    return;
  }
  auth.signInWithEmailAndPassword(email, pwd)
    .then(() => {
      loginPopup.style.display = "none";
    })
    .catch((e) => alert(e.message));
});

auth.onAuthStateChanged((user) => {
  if (user) {
    lockedMessage.style.display = "none";
    journalContent.style.display = "block";
    startRealtime();
  } else {
    journalContent.style.display = "none";
    lockedMessage.style.display = "block";
  }
});

// --- Calendrier ---
function generateCalendar(month, year) {
  calendarDays.innerHTML = "";
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  monthYear.textContent = `${monthNames[month]} ${year}`;

  // Jours du mois précédent
  for (let i = firstDay - 1; i >= 0; i--) {
    const dayElement = createDayElement(daysInPrevMonth - i, "other-month");
    calendarDays.appendChild(dayElement);
  }

  // Jours du mois courant
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const today = new Date().toISOString().split("T")[0];
    const dayElement = createDayElement(i, "", dateStr);

    if (dateStr === today) dayElement.classList.add("today");

    const hasEntries = allEntries.some((entry) => entry.data.date && entry.data.date.startsWith(dateStr));
    if (hasEntries) dayElement.classList.add("has-entries");

    calendarDays.appendChild(dayElement);
  }

  // Jours du mois suivant
  const totalDays = firstDay + daysInMonth;
  const remainingDays = 7 - (totalDays % 7);
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i++) {
      const dayElement = createDayElement(i, "other-month");
      calendarDays.appendChild(dayElement);
    }
  }
}

function createDayElement(day, className, dateStr = "") {
  const dayElement = document.createElement("div");
  dayElement.className = `calendar-day ${className}`;
  dayElement.textContent = day;
  if (dateStr) {
    dayElement.dataset.date = dateStr;
    dayElement.addEventListener("click", () => showEntriesForDate(dateStr));
  }
  return dayElement;
}

function showEntriesForDate(dateStr) {
  entriesList.innerHTML = "";
  const date = new Date(dateStr);
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  selectedDate.textContent = date.toLocaleDateString("fr-FR", options);

  const filteredEntries = allEntries.filter((entry) => entry.data.date && entry.data.date.startsWith(dateStr));

  if (filteredEntries.length === 0) {
    entriesList.innerHTML = "<p>Aucune entrée pour cette date.</p>";
    return;
  }

  filteredEntries.forEach((entry) => {
    const entryElement = document.createElement("div");
    entryElement.className = "entry";
    entryElement.innerHTML = `
      <div class="meta">
        <div class="title">${entry.data.title || "(sans titre)"}</div>
        <div class="date">${new Date(entry.data.date).toLocaleString("fr-FR")}</div>
      </div>
      <p>${entry.data.content}</p>
      ${entry.data.tags && entry.data.tags.length > 0 ? `<div class="entry-tags">${entry.data.tags.map((tag) => `<span class="tag">${tag}</span>`).join(" ")}</div>` : ""}
    `;
    entriesList.appendChild(entryElement);
  });
}

// Navigation entre les mois
document.getElementById("prevMonth").addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  generateCalendar(currentMonth, currentYear);
});

document.getElementById("nextMonth").addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  generateCalendar(currentMonth, currentYear);
});

// --- Firebase Realtime ---
function startRealtime() {
  db.collection("entries")
    .orderBy("date", "desc")
    .onSnapshot((snapshot) => {
      allEntries = snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }));
      allEntries.forEach((entry) => {
        if (entry.data.date && typeof entry.data.date !== "string" && entry.data.date.toDate) {
          entry.data.date = entry.data.date.toDate().toISOString();
        }
      });
      generateCalendar(currentMonth, currentYear);
      updateUIFromEntries();
    });
}

// --- Ajouter une entrée ---
addEntryBtn.addEventListener("click", () => {
  if (!auth.currentUser) {
    alert("Tu dois être connecté.");
    return;
  }
  const title = newTitle.value.trim();
  const content = newContent.value.trim();
  const tags = (newTags.value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!title && !content) {
    alert("Titre ou contenu requis");
    return;
  }

  db.collection("entries")
    .add({
      title: title || "(sans titre)",
      content: content || "",
      tags: tags,
      date: new Date().toISOString(),
    })
    .then(() => {
      newTitle.value = "";
      newContent.value = "";
      newTags.value = "";
    });
});

// --- Recherche ---
searchBtn.addEventListener("click", () => {
  currentFilter = {
    date: searchDate.value,
    text: searchText.value.toLowerCase(),
    tag: null,
  };
  renderEntries();
});

// --- Fonctions d'affichage ---
function updateUIFromEntries() {
  const tagSet = new Set();
  allEntries.forEach((entry) => {
    (entry.data.tags || []).forEach((tag) => tagSet.add(tag));
  });
  renderAllTags(Array.from(tagSet).sort());
  renderEntries();
}

function renderAllTags(tags) {
  allTagsDiv.innerHTML = "";
  tags.forEach((tag) => {
    const btn = document.createElement("button");
    btn.className = "tag";
    btn.textContent = tag;
    btn.addEventListener("click", () => {
      currentFilter.tag = tag;
      renderEntries();
    });
    allTagsDiv.appendChild(btn);
  });
}

function renderEntries() {
  entriesDiv.innerHTML = "";
  const fDate = currentFilter.date;
  const fText = (currentFilter.text || "").toLowerCase();
  const fTag = currentFilter.tag;

  const filtered = allEntries.filter((entry) => {
    const entryDate = entry.data.date ? entry.data.date.slice(0, 10) : null;
    if (fDate && entryDate !== fDate) return false;
    if (fTag && !(entry.data.tags || []).some((tag) => tag.toLowerCase() === fTag.toLowerCase())) return false;
    if (fText && !(entry.data.title + " " + entry.data.content + " " + (entry.data.tags || []).join(" ")).toLowerCase().includes(fText)) return false;
    return true;
  });

  if (filtered.length === 0) {
    entriesDiv.innerHTML = "<div>Aucune entrée</div>";
    return;
  }

  filtered.forEach((entry) => {
    const div = document.createElement("div");
    div.className = "entry";
    const dateStr = entry.data.date ? new Date(entry.data.date).toLocaleString("fr-FR") : "";
    const tagsHtml = (entry.data.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join(" ");
    div.innerHTML = `
      <div class="meta">
        <div class="title">${entry.data.title || "(sans titre)"}</div>
        <div class="date">${dateStr}</div>
      </div>
      <p>${entry.data.content}</p>
      ${tagsHtml ? `<div class="entry-tags">${tagsHtml}</div>` : ""}
    `;
    entriesDiv.appendChild(div);
  });
}

// --- Initialisation ---
generateCalendar(currentMonth, currentYear);
