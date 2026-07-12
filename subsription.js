/* ==========================================
   LOCIVIO SUBSCRIPTION SYSTEM
========================================== */

const FREE_DAYS = 5;
const FREE_LOCATIONS = 2;
const FREE_ITEMS = 20;
const ACCOUNT_STORAGE_KEY = "locivioAccount";

function createTrialAccount() {
  const now = new Date();

  return {
    plan: "trial",
    status: "active",
    trialStart: now.toISOString(),
    trialEnd: new Date(
      now.getTime() + FREE_DAYS * 24 * 60 * 60 * 1000
    ).toISOString()
  };
}

function getAccount() {
  let account;

  try {
    account = JSON.parse(
      localStorage.getItem(ACCOUNT_STORAGE_KEY) || "null"
    );
  } catch (error) {
    console.error("Invalid Locivio account data:", error);
    account = null;
  }

  // Create an account automatically when none exists
  if (!account || typeof account !== "object") {
    account = createTrialAccount();
    saveAccount(account);
    return account;
  }

  if (!account.trialStart) {
    account.trialStart = new Date().toISOString();
  }

  if (!account.trialEnd) {
    const start = new Date(account.trialStart);

    account.trialEnd = new Date(
      start.getTime() + FREE_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();
  }

  if (!account.plan) {
    account.plan = "trial";
  }

  if (!account.status) {
    account.status = "active";
  }

  saveAccount(account);
  return account;
}

function saveAccount(account) {
  localStorage.setItem(
    ACCOUNT_STORAGE_KEY,
    JSON.stringify(account)
  );
}

function isPlusUser(account = getAccount()) {
  return (
    account &&
    account.plan === "plus" &&
    account.status === "active"
  );
}

function getDaysRemaining() {
  const account = getAccount();

  if (!account) {
    return 0;
  }

  if (isPlusUser(account)) {
    return "∞";
  }

  const now = Date.now();
  const trialEnd = new Date(account.trialEnd).getTime();

  if (Number.isNaN(trialEnd)) {
    return 0;
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const difference = trialEnd - now;

  return Math.max(
    0,
    Math.ceil(difference / millisecondsPerDay)
  );
}

function checkTrialStatus() {
  const account = getAccount();

  if (!account) {
    return;
  }

  if (account.plan === "plus") {
    account.status = "active";
    saveAccount(account);
    return;
  }

  account.status =
    getDaysRemaining() > 0 ? "active" : "expired";

  saveAccount(account);
}

function updateUsageDashboard() {
  const account = getAccount();

  if (!account) {
    return;
  }

  const daysLeft = document.getElementById("daysLeft");
  const locationUsage = document.getElementById("locationUsage");
  const itemUsage = document.getElementById("itemUsage");
  const warning = document.getElementById("usageWarning");

  const daysRemaining = getDaysRemaining();

  if (daysLeft) {
    daysLeft.textContent = daysRemaining;
  }

  const finishDashboardUpdate = function (locations = []) {
    const safeLocations = Array.isArray(locations)
      ? locations
      : [];

    const locationCount = safeLocations.length;

    const itemCount =
      typeof countTotalItems === "function"
        ? countTotalItems(safeLocations)
        : safeLocations.reduce(function (total, location) {
            const items = Array.isArray(location.items)
              ? location.items
              : [];

            return total + items.length;
          }, 0);

    if (isPlusUser(account)) {
      if (locationUsage) {
        locationUsage.textContent =
          locationCount + " / Unlimited";
      }

      if (itemUsage) {
        itemUsage.textContent =
          itemCount + " / Unlimited";
      }

      if (warning) {
        warning.textContent =
          "⭐ Plus active. Unlimited locations and items.";
      }

      return;
    }

    if (locationUsage) {
      locationUsage.textContent =
        locationCount + " / " + FREE_LOCATIONS;
    }

    if (itemUsage) {
      itemUsage.textContent =
        itemCount + " / " + FREE_ITEMS;
    }

    let message = "5-day free trial active.";

    if (account.status === "expired") {
      message = "Your 5-day free trial has ended.";
    } else if (daysRemaining <= 2) {
      message =
        "⚠ Trial ends in " +
        daysRemaining +
        " day(s).";
    }

    if (warning) {
      warning.textContent = message;
    }
  };

  if (typeof getAllLocations === "function") {
    getAllLocations(finishDashboardUpdate);
  } else {
    finishDashboardUpdate([]);
  }
}

function canEditData() {
  const account = getAccount();

  if (!account) {
    alert("Please log in first.");
    return false;
  }

  checkTrialStatus();

  if (isPlusUser()) {
    return true;
  }

  if (getAccount().status === "expired") {
    alert(
      "Your 5-day free trial has ended. Subscribe to Plus."
    );
    return false;
  }

  return true;
}

function subscribePlus() {
  alert("Stripe payment will be connected here.");
}

function activatePlus() {
  const account = getAccount();

  account.plan = "plus";
  account.status = "active";

  saveAccount(account);
  updateUsageDashboard();

  if (typeof refreshData === "function") {
    refreshData();
  }
}

function resetTrial() {
  const account = createTrialAccount();

  saveAccount(account);
  updateUsageDashboard();

  if (typeof refreshData === "function") {
    refreshData();
  }

  console.log("Locivio trial reset to 5 days.");
}

function expireTrial() {
  const account = getAccount();

  account.status = "expired";
  account.trialEnd = new Date().toISOString();

  saveAccount(account);
  updateUsageDashboard();

  if (typeof refreshData === "function") {
    refreshData();
  }
}

function initSubscription() {
  getAccount();
  checkTrialStatus();
  updateUsageDashboard();
}

document.addEventListener("DOMContentLoaded", function () {
  initSubscription();
});
