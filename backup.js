/* ==========================================
   LOCIVIO BACKUP / RESTORE
========================================== */

function createBackupFile(callback) {
  getAllLocations(function (locations) {
    const account = getAccount();

    const backup = {
      app: "Locivio",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      accountEmail: account ? account.email : "",
      locations: locations
    };

    const data = JSON.stringify(backup, null, 2);

    const file = new File(
      [data],
      "locivio-backup.json",
      { type: "application/json" }
    );

    callback(file, data);
  });
}

function exportData() {
  createBackupFile(function (file, data) {
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "locivio-backup.json";
    link.click();

    URL.revokeObjectURL(url);
  });
}

async function shareBackup() {
  createBackupFile(async function (file) {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: "Locivio Backup",
          text: "My private Locivio backup file",
          files: [file]
        });
      } catch (error) {
        alert("Sharing was cancelled or failed.");
      }
    } else {
      alert("Sharing is not supported on this browser. Downloading backup instead.");
      exportData();
    }
  });
}

function importData(event) {
  if (!canEditData()) return;

  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      const locations = imported.locations || imported.scans || imported;

      if (!Array.isArray(locations)) {
        alert("Invalid backup file.");
        return;
      }

      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      locations.forEach(location => {
        delete location.id;
        store.add(location);
      });

      tx.oncomplete = function () {
        alert("Backup imported successfully.");
        refreshData();
      };

    } catch (error) {
      alert("Could not import backup file.");
    }
  };

  reader.readAsText(file);
}
