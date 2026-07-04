/* ==========================================
   LOCIVIO APP CONTROLLER
========================================== */

window.showScreen = function (screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.add("hidden");
  });

  const selected = document.getElementById(screenId);
  if (selected) {
    selected.classList.remove("hidden");
    selected.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const hero = document.getElementById("logoTapArea");
  if (hero) {
    if (screenId === "signupScreen" || screenId === "loginScreen") {
      hero.classList.remove("hidden");
    } else {
      hero.classList.add("hidden");
    }
  }

  if (screenId === "appScreen") {
    refreshData();
  }
};

function initApp() {
  showLanding();

  if (typeof checkLogin === "function") checkLogin();
  if (typeof initSubscription === "function") initSubscription();

  refreshData();
}

function showLanding() {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.add("hidden");
  });

  const hero = document.getElementById("logoTapArea");
  if (hero) hero.classList.remove("hidden");
}

function refreshData() {
  if (typeof getAllLocations !== "function") return;

  getAllLocations(function (locations) {
    updateDashboard(locations);
    renderDropdowns(locations);
    renderLocations(locations);
    renderFavorites(locations);

    if (typeof updateUsageDashboard === "function") updateUsageDashboard();
    if (typeof updateAccountStatus === "function") updateAccountStatus();
    if (typeof checkTrialStatus === "function") checkTrialStatus();
  });
}

function updateDashboard(locations) {
  const places = document.getElementById("kpiPlaces");
  const items = document.getElementById("kpiItems");
  const favorites = document.getElementById("kpiFavorites");
  const recentBox = document.getElementById("recentBox");

  if (places) places.innerText = locations.length;

  if (items) {
    if (typeof countTotalItems === "function") {
      items.innerText = countTotalItems(locations);
    } else {
      items.innerText = locations.reduce((total, loc) => total + ((loc.items || []).length), 0);
    }
  }

  if (favorites) {
    if (typeof countTotalFavorites === "function") {
      favorites.innerText = countTotalFavorites(locations);
    } else {
      favorites.innerText = locations.reduce((total, loc) => total + ((loc.favorites || []).length), 0);
    }
  }

  if (!recentBox) return;

  if (locations.length === 0) {
    recentBox.innerHTML = "<strong>Recently Added:</strong> Nothing yet.";
    return;
  }

  const last = locations[locations.length - 1];

  recentBox.innerHTML = `
    <strong>Recently Added:</strong><br>
    ${escapeHTML(last.location)} — ${escapeHTML((last.items || []).join(", "))}
  `;
}

function renderDropdowns(locations) {
  const existingSelect = document.getElementById("existingSelect");
  const moveSelect = document.getElementById("movePlaceSelect");

  if (!existingSelect || !moveSelect) return;

  existingSelect.innerHTML = "";
  moveSelect.innerHTML = "";

  if (locations.length === 0) {
    existingSelect.innerHTML = "<option value=''>No saved locations</option>";
    moveSelect.innerHTML = "<option value=''>No saved locations</option>";
    return;
  }

  locations.forEach(location => {
    const label = `${location.area || ""} ${location.location || ""} — ${location.detail || ""}`;

    existingSelect.innerHTML += `
      <option value="${location.id}">${escapeHTML(label)}</option>
    `;

    moveSelect.innerHTML += `
      <option value="${location.id}">${escapeHTML(label)}</option>
    `;
  });
}

function renderLocations(locations) {
  const allScans = document.getElementById("allScans");
  if (!allScans) return;

  allScans.innerHTML = "";

  if (locations.length === 0) {
    allScans.innerHTML = "<p>No saved locations yet.</p>";
    return;
  }

  locations.slice().reverse().forEach(location => {
    allScans.innerHTML += renderLocationCard(location);
  });
}

function renderLocationCard(location) {
  const favorites = location.favorites || [];
  const items = location.items || [];

  return `
    <div class="result">
      <strong>${escapeHTML(location.scanMode || "Location")}:</strong>
      ${escapeHTML(location.location)}<br>

      <strong>Area:</strong>
      ${escapeHTML(location.area || "No area added")}<br>

      <strong>Detail:</strong>
      ${escapeHTML(location.detail || "No detail added")}<br>

      <strong>Items:</strong><br>
      ${items.map(item => `
        <span class="tag">${favorites.includes(item) ? "⭐ " : ""}${escapeHTML(item)}</span>
      `).join("")}

      <br><br>

      <strong>Notes:</strong>
      ${escapeHTML(location.notes || "No notes")}<br>

      <strong>Created:</strong>
      ${escapeHTML(location.created || "")}<br>

      <strong>Updated:</strong>
      ${escapeHTML(location.updated || "")}

      ${location.insidePhoto ? `<br><strong>Inside Photo:</strong><img src="${location.insidePhoto}">` : ""}
      ${location.outsidePhoto ? `<br><strong>Outside Photo:</strong><img src="${location.outsidePhoto}">` : ""}

      <label>Favorite an item</label>
      <select id="favSelect_${location.id}">
        ${items.map(item => `
          <option value="${escapeHTML(item)}">${escapeHTML(item)}</option>
        `).join("")}
      </select>

      <button class="secondary" onclick="toggleFavoriteFromSelect('${location.id}')">⭐ Toggle Favorite</button>
      <button class="danger" onclick="deleteLocation('${location.id}')">Delete Location</button>
    </div>
  `;
}

function renderFavorites(locations) {
  const box = document.getElementById("favoritesBox");
  if (!box) return;

  box.innerHTML = "";
  let hasFavorites = false;

  locations.forEach(location => {
    (location.favorites || []).forEach(item => {
      hasFavorites = true;

      box.innerHTML += `
        <div class="result favorite">
          ⭐ <strong>${escapeHTML(item)}</strong><br>
          ${escapeHTML(location.area || "")}
          ${escapeHTML(location.location || "")}
          — ${escapeHTML(location.detail || "")}

          <button onclick="findFavorite('${escapeQuotes(item)}')">Find This</button>
        </div>
      `;
    });
  });

  if (!hasFavorites) {
    box.innerHTML = "<p>No favorite items yet.</p>";
  }
}

window.findFavorite = function (item) {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.value = item;
  searchItems(true);
};

function cleanSearch(text) {
  return String(text || "")
    .toLowerCase()
    .replace("where is my", "")
    .replace("where is", "")
    .replace("find my", "")
    .replace("find", "")
    .replace("search for", "")
    .replace("?", "")
    .trim();
}

window.searchItems = function (talkBack = false) {
  const searchInput = document.getElementById("searchInput");
  const answerBox = document.getElementById("answerBox");
  const results = document.getElementById("searchResults");

  if (!searchInput || !answerBox || !results) return;

  const raw = searchInput.value.trim();
  const query = cleanSearch(raw);

  answerBox.innerHTML = "";
  results.innerHTML = "";

  if (!query) return;
  if (typeof getAllLocations !== "function") return;

  getAllLocations(function (locations) {
    const matches = locations.filter(location =>
      (location.area || "").toLowerCase().includes(query) ||
      (location.location || "").toLowerCase().includes(query) ||
      (location.detail || "").toLowerCase().includes(query) ||
      (location.notes || "").toLowerCase().includes(query) ||
      (location.items || []).some(item => String(item).toLowerCase().includes(query))
    );

    if (matches.length === 0) {
      const message = getNoResultText(query);
      answerBox.innerHTML = message;
      if (talkBack && typeof speak === "function") speak(message);
      return;
    }

    const answer = buildAnswer(query, matches[0]);
    answerBox.innerHTML = answer;
    if (talkBack && typeof speak === "function") speak(answer);

    matches.forEach(location => {
      results.innerHTML += renderLocationCard(location);
    });
  });
};

function buildAnswer(item, location) {
  const lang = typeof getLang === "function" ? getLang() : "en-US";

  const area = location.area ? location.area + ", " : "";
  const loc = location.location || "";
  const detail = location.detail ? ", " + location.detail : "";

  if (lang === "es-ES") {
    return `Encontré ${item}. Está en ${area}${loc}${detail}.`;
  }

  if (lang === "am-ET") {
    return `${item} ተገኝቷል። ቦታው ${area}${loc}${detail} ነው።`;
  }

  return `I found ${item}. It is in ${area}${loc}${detail}.`;
}

function getNoResultText(item) {
  const lang = typeof getLang === "function" ? getLang() : "en-US";

  if (lang === "es-ES") return `No encontré ${item}.`;
  if (lang === "am-ET") return `${item} አልተገኘም።`;

  return `I could not find ${item}.`;
}

function escapeHTML(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeQuotes(text) {
  return String(text || "").replace(/'/g, "\\'");
}

window.addEventListener("DOMContentLoaded", initApp);
