/* ==========================================
   LOCIVIO AI IMAGE RECOGNITION
========================================== */

let objectDetectionModel = null;
let aiIsLoading = false;

async function loadAIModel() {
  if (objectDetectionModel) return objectDetectionModel;

  if (aiIsLoading) {
    alert("AI is still loading. Please try again in a few seconds.");
    return null;
  }

  try {
    aiIsLoading = true;

    if (typeof cocoSsd === "undefined") {
      alert("AI model not loaded. Check your internet connection.");
      aiIsLoading = false;
      return null;
    }

    objectDetectionModel = await cocoSsd.load();
    aiIsLoading = false;

    return objectDetectionModel;
  } catch (error) {
    aiIsLoading = false;
    alert("AI image recognition failed to load.");
    return null;
  }
}

async function runImageRecognition() {
  if (!canEditData()) return;

  const image = document.getElementById("insidePreview");
  const itemsInput = document.getElementById("itemsInput");

  if (!image || image.style.display === "none" || !image.src) {
    alert("Please take or upload an inside photo first.");
    return;
  }

  if (typeof speak === "function") {
    speak("Analyzing photo.");
  }

  const model = await loadAIModel();
  if (!model) return;

  try {
    const predictions = await model.detect(image);

    if (!predictions || predictions.length === 0) {
      alert("I could not detect clear objects. You can still speak or type the items.");
      if (typeof speak === "function") {
        speak("I could not detect clear objects. Please add items by voice or typing.");
      }
      return;
    }

    const detectedItems = [
      ...new Set(
        predictions
          .filter(p => p.score >= 0.45)
          .map(p => cleanAIName(p.class))
      )
    ];

    if (detectedItems.length === 0) {
      alert("Objects were unclear. Please confirm items manually.");
      if (typeof speak === "function") {
        speak("Objects were unclear. Please confirm items manually.");
      }
      return;
    }

    mergeDetectedItems(detectedItems, itemsInput);

    alert(
      "Locivio detected:\n\n" +
      detectedItems.join("\n") +
      "\n\nPlease confirm or add anything hidden."
    );

    if (typeof speak === "function") {
      speak("I found " + detectedItems.join(", ") + ". Please confirm or add anything hidden.");
    }
  } catch (error) {
    alert("AI recognition failed. You can still enter items manually.");
  }
}

function mergeDetectedItems(detectedItems, input) {
  const existing = cleanItems(input.value || "");
  const merged = [...new Set([...existing, ...detectedItems])];
  input.value = merged.join(", ");
}

function cleanAIName(name) {
  const map = {
    "cell phone": "phone",
    "tv": "television",
    "remote": "remote control",
    "sports ball": "ball",
    "handbag": "bag",
    "backpack": "backpack",
    "suitcase": "suitcase",
    "laptop": "laptop",
    "book": "book",
    "bottle": "bottle",
    "cup": "cup",
    "chair": "chair",
    "keyboard": "keyboard",
    "mouse": "computer mouse"
  };

  return map[name] || name;
}

function recognizeClosedBox() {
  if (!canEditData()) return;

  getAllLocations(function (locations) {
    const savedWithOutsidePhoto = locations.filter(loc => loc.outsidePhoto);
    const result = document.getElementById("recognizeResult");

    if (!result) return;

    if (savedWithOutsidePhoto.length === 0) {
      result.innerHTML = "<p>No saved outside box photo found. Save a box with an outside photo first.</p>";
      if (typeof speak === "function") {
        speak("No saved outside box photo found.");
      }
      return;
    }

    const match = savedWithOutsidePhoto[0];

    result.innerHTML = `
      <div class="result">
        <strong>Possible Match:</strong> ${escapeHTML(match.location)}<br>
        <strong>Detail:</strong> ${escapeHTML(match.detail || "No detail")}<br>
        <strong>Inside this location:</strong><br>
        ${match.items.map(item => `<span class="tag">${escapeHTML(item)}</span>`).join("")}

        ${match.outsidePhoto ? `<br><strong>Saved Outside Photo:</strong><img src="${match.outsidePhoto}">` : ""}
        ${match.insidePhoto ? `<br><strong>Saved Inside Photo:</strong><img src="${match.insidePhoto}">` : ""}
      </div>
    `;

    if (typeof speak === "function") {
      speak(
        "This looks like " +
        match.location +
        ". It contains " +
        match.items.join(", ")
      );
    }
  });
}
