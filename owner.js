/* ==========================================
   LOCIVIO OWNER MODE
========================================== */

let ownerTapCount = 0;
const OWNER_PIN = "2468";

document.addEventListener("DOMContentLoaded", function () {
  const logoTapArea = document.getElementById("logoTapArea");

  if (logoTapArea) {
    logoTapArea.addEventListener("click", secretTap);
  }
});

function secretTap() {
  ownerTapCount++;

  if (ownerTapCount >= 7) {
    ownerTapCount = 0;
    openOwnerMode();
  }

  setTimeout(function () {
    ownerTapCount = 0;
  }, 3000);
}

function openOwnerMode() {
  const pin = prompt("Enter owner PIN:");

  if (pin !== OWNER_PIN) {
    alert("Incorrect PIN.");
    return;
  }

  const ownerPanel = document.getElementById("ownerPanel");

  if (ownerPanel) {
    ownerPanel.classList.remove("hidden");
    ownerPanel.scrollIntoView({ behavior: "smooth" });
  }
}

function ownerSetPlus() {
  activatePlus();
  alert("Plus activated for this account.");
}

function ownerResetTrial() {
  resetTrial();
  alert("Trial reset.");
}

function ownerExpire() {
  expireTrial();
  alert("Account expired.");
}

function loadDemoData() {
  if (!canEditData()) return;

  const sampleLocations = [
    {
      ownerEmail: getAccount() ? getAccount().email : "",
      scanMode: "Important Documents",
      area: "Upstairs",
      location: "Bedroom Closet",
      detail: "Top shelf, black box",
      items: ["passport", "birth certificate", "social security card", "tax documents"],
      itemDetails: createItemDetails(["passport", "birth certificate", "social security card", "tax documents"], "sample"),
      aiObjects: [],
      notes: "Important family documents.",
      insidePhoto: "",
      outsidePhoto: "",
      favorites: ["passport", "birth certificate"],
      history: [],
      tags: ["documents", "emergency"],
      colorLabel: "gold",
      archived: false,
      created: new Date().toLocaleString(),
      updated: new Date().toLocaleString()
    },
    {
      ownerEmail: getAccount() ? getAccount().email : "",
      scanMode: "Closet",
      area: "Upstairs",
      location: "Master Bedroom Closet",
      detail: "Left hanging rack",
      items: ["blue sweater", "black jacket", "winter coat", "dress shoes"],
      itemDetails: createItemDetails(["blue sweater", "black jacket", "winter coat", "dress shoes"], "sample"),
      aiObjects: [],
      notes: "Seasonal clothing.",
      insidePhoto: "",
      outsidePhoto: "",
      favorites: ["blue sweater"],
      history: [],
      tags: ["clothing"],
      colorLabel: "blue",
      archived: false,
      created: new Date().toLocaleString(),
      updated: new Date().toLocaleString()
    },
    {
      ownerEmail: getAccount() ? getAccount().email : "",
      scanMode: "Garage Section",
      area: "Garage",
      location: "Left Wall Shelf",
      detail: "Shelf 2",
      items: ["drill", "charger", "extension cord", "hammer"],
      itemDetails: createItemDetails(["drill", "charger", "extension cord", "hammer"], "sample"),
      aiObjects: [],
      notes: "Main tool area.",
      insidePhoto: "",
      outsidePhoto: "",
      favorites: [],
      history: [],
      tags: ["tools"],
      colorLabel: "green",
      archived: false,
      created: new Date().toLocaleString(),
      updated: new Date().toLocaleString()
    }
  ];

  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  sampleLocations.forEach(location => {
    store.add(location);
  });

  tx.oncomplete = function () {
    alert("Sample data loaded.");
    refreshData();
  };
}

function resetAllData() {
  if (!confirm("Delete all saved Locivio data from this device?")) return;

  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  store.clear();

  tx.oncomplete = function () {
    alert("All saved data deleted.");
    refreshData();
  };
}
