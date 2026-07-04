/* ==========================================
   LOCIVIO SUBSCRIPTION SYSTEM
========================================== */

const FREE_DAYS = 5;
const FREE_LOCATIONS = 2;
const FREE_ITEMS = 20;

function getAccount() {
  const account = JSON.parse(localStorage.getItem("locivioAccount") || "null");
  if (!account) return null;

  if (!account.trialStart) {
    account.trialStart = new Date().toISOString();
  }

  if (!account.trialEnd) {
    const start = new Date(account.trialStart);
    account.trialEnd = new Date(start.getTime() + FREE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  }

  if (!account.plan) account.plan = "trial";
  if (!account.status) account.status = "active";

  saveAccount(account);
  return account;
}

function saveAccount(account) {
  localStorage.setItem("locivioAccount", JSON.stringify(account));
}

function isPlusUser() {
  const account = getAccount();
  return account && account.plan === "plus" && account.status === "active";
}

function getDaysRemaining() {
  const account = getAccount();
  if (!account) return 0;
  if (isPlusUser()) return "∞";

  const now = new Date();
  const end = new Date(account.trialEnd);
  const diff = end - now;

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function checkTrialStatus() {
  const account = getAccount();
  if (!account) return;

  if (account.plan === "plus") {
    account.status = "active";
    saveAccount(account);
    return;
  }

  if (getDaysRemaining() <= 0) {
    account.status = "expired";
  } else {
    account.status = "active";
  }

  saveAccount(account);
}

function updateUsageDashboard() {
  const account = getAccount();
  if (!account) return;

  if (typeof getAllLocations !== "function") return;

  getAllLocations(function (locations) {
    const locationCount = locations.length;
    const itemCount = typeof countTotalItems === "function"
      ? countTotalItems(locations)
      : locations.reduce((total, loc) => total + ((loc.items || []).length), 0);

    const daysLeft = document.getElementById("daysLeft");
    const locationUsage = document.getElementById("locationUsage");
    const itemUsage = document.getElementById("itemUsage");
    const warning = document.getElementById("usageWarning");

    if (daysLeft) daysLeft.innerText = getDaysRemaining();

    if (isPlusUser()) {
      if (locationUsage) locationUsage.innerText = locationCount + " / Unlimited";
      if (itemUsage) itemUsage.innerText = itemCount + " / Unlimited";
      if (warning) warning.innerHTML = "⭐ Plus active. Unlimited locations and items.";
      return;
    }

    if (locationUsage) locationUsage.innerText = locationCount + " / " + FREE_LOCATIONS;
    if (itemUsage) itemUsage.innerText = itemCount + " / " + FREE_ITEMS;

    let message = "5-day free trial active.";

    if (account.status === "expired") {
      message = "Your 5-day free trial has ended.";
    } else if (getDaysRemaining() <= 2) {
      message = `⚠ Trial ends in ${getDaysRemaining()} day(s).`;
    }

    if (warning) warning.innerHTML = message;
  });
}

function canEditData() {
  const account = getAccount();

  if (!account) {
    alert("Please login first.");
    return false;
  }

  checkTrialStatus();

  if (isPlusUser()) return true;

  if (getAccount().status === "expired") {
    alert("Your 5-day free trial has ended. Subscribe to Plus.");
    return false;
  }

  return true;
}

function subscribePlus() {
  alert("Stripe payment will be connected here.");
}

function activatePlus() {
  const account = getAccount();
  if (!account) return;

  account.plan = "plus";
  account.status = "active";
  saveAccount(account);

  updateUsageDashboard();
  refreshData();
}

function resetTrial() {
  const today = new Date();

  const account = getAccount() || {};
  account.plan = "trial";
  account.status = "active";
  account.trialStart = today.toISOString();
  account.trialEnd = new Date(today.getTime() + FREE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  saveAccount(account);

  updateUsageDashboard();
  refreshData();
}

function expireTrial() {
  const account = getAccount();
  if (!account) return;

  account.status = "expired";
  saveAccount(account);

  updateUsageDashboard();
  refreshData();
}

function initSubscription() {
  checkTrialStatus();
  updateUsageDashboard();
}
