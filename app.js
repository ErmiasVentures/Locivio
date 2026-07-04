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

  if (typeof checkLogin === "function") {
    checkLogin();
  }

  if (typeof initSubscription === "function") {
    initSubscription();
  }

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
    if (typeof updateUsageDashboard === "function") updateUsageDashboard();
    renderDropdowns(locations);
    renderLocations(locations);
    renderFavorites(locations);

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
  if (items && typeof countTotalItems === "function") items.innerText = countTotalItems(locations);
  if (favorites && typeof countTotalFavorites === "function") favorites.innerText = countTotalFavorites(locations);

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
