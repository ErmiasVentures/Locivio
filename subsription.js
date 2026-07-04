/* ==========================================
   LOCIVIO SUBSCRIPTION SYSTEM
========================================== */

const FREE_DAYS = 5;
const FREE_LOCATIONS = 2;
const FREE_ITEMS = 20;

function isPlusUser() {
  const account = getAccount();
  return account && account.plan === "plus" && account.status === "active";
}

function canEditData() {
  const account = getAccount();

  if (!account) {
    alert("Please login first.");
    return false;
  }

  checkTrialStatus();

  const updatedAccount = getAccount();

  if (isPlusUser()) return true;

  if (updatedAccount.status === "expired") {
    alert("Your 5-day free trial has ended. Subscribe to Plus to add or edit locations.");
    return false;
  }

  return true;
}

function checkTrialStatus() {
  const account = getAccount();
  if (!account) return;

  if (account.plan === "plus") {
    account.status = "active";
    saveAccount(account);
    return;
  }

  const now = new Date();
  const trialEnd = new Date(account.trialEnd);

  if (now > trialEnd) {
    account.status = "expired";
    saveAccount(account);
  }
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

function updateUsageDashboard() {
  const account = getAccount();
  if (!account || typeof db === "undefined" || !db) return;

  getAllLocations(function (locations) {
    const locationCount = locations.length;
    const itemCount = countTotalItems(locations);

    const daysLeft = document.getElementById("daysLeft");
    const locationUsage = document.getElementById("locationUsage");
    const itemUsage = document.getElementById("itemUsage");
    const warning = document.getElementById("usageWarning");

    if (!daysLeft || !locationUsage || !itemUsage || !warning) return;

    daysLeft.innerText = getDaysRemaining();

    if (isPlusUser()) {
      locationUsage.innerText = locationCount + " / Unlimited";
      itemUsage.innerText = itemCount + " / Unlimited";
      warning.innerHTML = "⭐ Plus active. Unlimited locations and items.";
      return;
    }

    locationUsage.innerText = locationCount + " / " + FREE_LOCATIONS;
    itemUsage.innerText = itemCount + " / " + FREE_ITEMS;

    let message = "";

    if (account.status === "expired") {
      message = `
        <strong>Your 5-day free trial has ended.</strong><br>
        You can still search and view saved items, but adding/editing is locked until you subscribe.
      `;
    } else {
      const remaining = getDaysRemaining();

      if (remaining <= 2) {
        message += `⚠ Trial ends in ${remaining} day(s).<br>`;
      }

      if (locationCount >= FREE_LOCATIONS) {
        message += "⚠ Free trial location limit reached.<br>";
      }

      if (itemCount >= FREE_ITEMS) {
        message += "⚠ Free trial item limit reached.<br>";
      }

      if (!message) {
        message = "5-day free trial active.";
      }
    }

    warning.innerHTML = message;
  });
}

function subscribePlus() {
  alert(
    "Stripe payment will be connected here.\n\n" +
    "Plus will be $3.99/month and includes:\n\n" +
    "• Unlimited locations\n" +
    "• Unlimited items\n" +
    "• AI image recognition\n" +
    "• Add to existing locations\n" +
    "• Move items\n" +
    "• Voice search\n" +
    "• Talk-back answers\n" +
    "• Backup and restore"
  );
}

function activatePlus() {
  const account = getAccount();
  if (!account) return;

  account.plan = "plus";
  account.status = "active";
  saveAccount(account);

  updateAccountStatus();
  updateUsageDashboard();
  refreshData();
}

function resetTrial() {
  const account = getAccount();
  if (!account) return;

  const today = new Date();

  account.plan = "trial";
  account.status = "active";
  account.trialStart = today.toISOString();
  account.trialEnd = new Date(today.getTime() + FREE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  saveAccount(account);

  updateAccountStatus();
  updateUsageDashboard();
  refreshData();
}

function expireTrial() {
  const account = getAccount();
  if (!account) return;

  account.status = "expired";
  saveAccount(account);

  updateAccountStatus();
  updateUsageDashboard();
  refreshData();
}

function initSubscription() {
  checkTrialStatus();
  updateUsageDashboard();
}

