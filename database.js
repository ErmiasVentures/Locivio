
/* ==========================================
   LOCIVIO DATABASE
========================================== */

let db;
let insidePhotoBase64 = "";
let outsidePhotoBase64 = "";

const DB_NAME = "LocivioDB";
const STORE_NAME = "locations";

const dbRequest = indexedDB.open(DB_NAME, 1);

dbRequest.onerror = function () {
  alert("Locivio database failed to open.");
};

dbRequest.onsuccess = function (event) {
  db = event.target.result;

  if (typeof initApp === "function") {
    initApp();
  }
};

dbRequest.onupgradeneeded = function (event) {
  db = event.target.result;

  if (!db.objectStoreNames.contains(STORE_NAME)) {
    db.createObjectStore(STORE_NAME, {
      keyPath: "id",
      autoIncrement: true
    });
  }
};

document.addEventListener("DOMContentLoaded", function () {
  const insideInput = document.getElementById("insidePhotoInput");
  const outsideInput = document.getElementById("outsidePhotoInput");

  if (insideInput) {
    insideInput.addEventListener("change", function (event) {
      readPhoto(event, "inside");
    });
  }

  if (outsideInput) {
    outsideInput.addEventListener("change", function (event) {
      readPhoto(event, "outside");
    });
  }
});

function readPhoto(event, type) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    if (type === "inside") {
      insidePhotoBase64 = e.target.result;
      const preview = document.getElementById("insidePreview");
      preview.src = insidePhotoBase64;
      preview.style.display = "block";
    } else {
      outsidePhotoBase64 = e.target.result;
      const preview = document.getElementById("outsidePreview");
      preview.src = outsidePhotoBase64;
      preview.style.display = "block";
    }
  };

  reader.readAsDataURL(file);
}

function cleanItems(text) {
  return text
    .replace(/and/gi, ",")
    .replace(/\n/g, ",")
    .split(",")
    .map(item => item.trim().toLowerCase())
    .filter(item => item.length > 0);
}

function createItemDetails(items, source) {
  return items.map(item => ({
    name: item,
    source: source || "manual",
    favorite: false,
    notes: "",
    dateAdded: new Date().toISOString()
  }));
}

function getAllLocations(callback) {
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();

  request.onsuccess = function () {
    callback(request.result || []);
  };
}

function getLocationById(id, callback) {
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const request = store.get(Number(id));

  request.onsuccess = function () {
    callback(request.result);
  };
}

function countTotalItems(locations) {
  return locations.reduce((total, loc) => total + loc.items.length, 0);
}

function countTotalFavorites(locations) {
  return locations.reduce((total, loc) => total + (loc.favorites || []).length, 0);
}

function saveNewPlace() {
  if (!canEditData()) return;

  getAllLocations(function (locations) {
    const locationCount = locations.length;
    const itemCount = countTotalItems(locations);

    const itemText = document.getElementById("itemsInput").value.trim();
    const items = cleanItems(itemText);

    if (!isPlusUser()) {
      if (locationCount >= FREE_LOCATIONS) {
        alert("Free trial allows up to 2 locations. Subscribe to Plus for unlimited locations.");
        return;
      }

      if (itemCount + items.length > FREE_ITEMS) {
        alert("Free trial allows up to 20 items total. Subscribe to Plus for unlimited items.");
        return;
      }
    }

    const location = document.getElementById("locationInput").value.trim();

    if (!location) {
      alert("Please enter a location.");
      return;
    }

    if (items.length === 0) {
      alert("Please enter or speak at least one item.");
      return;
    }

    const account = getAccount();

    const record = {
      ownerEmail: account ? account.email : "",
      scanMode: document.getElementById("scanMode").value,
      area: document.getElementById("areaInput").value.trim(),
      location: location,
      detail: document.getElementById("detailInput").value.trim(),
      items: items,
      itemDetails: createItemDetails(items, "manual"),
      aiObjects: [],
      notes: document.getElementById("notesInput").value.trim(),
      insidePhoto: insidePhotoBase64,
      outsidePhoto: outsidePhotoBase64,
      favorites: [],
      history: [],
      tags: [],
      colorLabel: "",
      archived: false,
      created: new Date().toLocaleString(),
      updated: new Date().toLocaleString()
    };

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.add(record);

    tx.oncomplete = function () {
      document.getElementById("newStatus").innerText = "Location saved.";
      clearNewLocationForm();
      refreshData();
    };
  });
}

function clearNewLocationForm() {
  document.getElementById("areaInput").value = "";
  document.getElementById("locationInput").value = "";
  document.getElementById("detailInput").value = "";
  document.getElementById("itemsInput").value = "";
  document.getElementById("notesInput").value = "";
  document.getElementById("insidePhotoInput").value = "";
  document.getElementById("outsidePhotoInput").value = "";

  document.getElementById("insidePreview").style.display = "none";
  document.getElementById("outsidePreview").style.display = "none";

  insidePhotoBase64 = "";
  outsidePhotoBase64 = "";
}

function addToExisting() {
  if (!canEditData()) return;

  if (!isPlusUser()) {
    alert("Adding items to an existing location is a Plus feature.");
    return;
  }

  const id = document.getElementById("existingSelect").value;
  const newItems = cleanItems(document.getElementById("addItemsInput").value);
  const newNotes = document.getElementById("addNotesInput").value.trim();

  if (!id) {
    alert("Please select a location.");
    return;
  }

  if (newItems.length === 0) {
    alert("Please enter items to add.");
    return;
  }

  getLocationById(id, function (record) {
    if (!record) return;

    record.items = [...new Set([...record.items, ...newItems])];

    record.itemDetails = record.itemDetails || [];
    record.itemDetails.push(...createItemDetails(newItems, "manual"));

    if (newNotes) {
      record.notes = record.notes ? record.notes + "\n" + newNotes : newNotes;
    }

    record.history = record.history || [];
    record.history.push({
      action: "items added",
      items: newItems,
      date: new Date().toLocaleString()
    });

    record.updated = new Date().toLocaleString();

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(record);

    tx.oncomplete = function () {
      document.getElementById("addItemsInput").value = "";
      document.getElementById("addNotesInput").value = "";
      document.getElementById("addStatus").innerText = "Items added.";
      refreshData();
    };
  });
}

function moveItem() {
  if (!canEditData()) return;

  if (!isPlusUser()) {
    alert("Moving items is a Plus feature.");
    return;
  }

  const item = document.getElementById("moveItemInput").value.trim().toLowerCase();
  const targetId = Number(document.getElementById("movePlaceSelect").value);

  if (!item) {
    alert("Enter the item you want to move.");
    return;
  }

  if (!targetId) {
    alert("Select the destination location.");
    return;
  }

  getAllLocations(function (locations) {
    let target = locations.find(loc => loc.id === targetId);

    if (!target) {
      alert("Destination not found.");
      return;
    }

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    locations.forEach(record => {
      if (record.id !== targetId && record.items.includes(item)) {
        record.items = record.items.filter(x => x !== item);
        record.itemDetails = (record.itemDetails || []).filter(x => x.name !== item);

        record.history = record.history || [];
        record.history.push({
          item: item,
          action: "moved out",
          to: target.location,
          date: new Date().toLocaleString()
        });

        record.updated = new Date().toLocaleString();
        store.put(record);
      }
    });

    if (!target.items.includes(item)) {
      target.items.push(item);
      target.itemDetails = target.itemDetails || [];
      target.itemDetails.push(...createItemDetails([item], "moved"));

      target.history = target.history || [];
      target.history.push({
        item: item,
        action: "moved in",
        date: new Date().toLocaleString()
      });

      target.updated = new Date().toLocaleString();
      store.put(target);
    }

    tx.oncomplete = function () {
      document.getElementById("moveItemInput").value = "";
      document.getElementById("moveStatus").innerText = "Item moved.";
      refreshData();
    };
  });
}

function deleteLocation(id) {
  if (!canEditData()) return;

  if (!confirm("Delete this location?")) return;

  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.delete(Number(id));

  tx.oncomplete = function () {
    refreshData();
  };
}

function toggleFavorite(id, item) {
  getLocationById(id, function (record) {
    if (!record) return;

    record.favorites = record.favorites || [];

    if (record.favorites.includes(item)) {
      record.favorites = record.favorites.filter(x => x !== item);
    } else {
      record.favorites.push(item);
    }

    record.updated = new Date().toLocaleString();

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(record);

    tx.oncomplete = function () {
      refreshData();
    };
  });
}

function toggleFavoriteFromSelect(id) {
  const select = document.getElementById("favSelect_" + id);
  if (!select) return;

  toggleFavorite(id, select.value);
}
