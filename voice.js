
/* ==========================================
   LOCIVIO VOICE SYSTEM
========================================== */

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let voiceAssistantActive = false;
let activeRecognition = null;

function getLang() {
  const lang = document.getElementById("languageSelect");
  return lang ? lang.value : "en-US";
}

function startVoice(inputId, append = false) {
  if (!SpeechRecognition) {
    alert("Voice recognition is not supported on this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = getLang();
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onresult = function (event) {
    const spokenText = event.results[0][0].transcript;
    const input = document.getElementById(inputId);

    if (!input) return;

    if (append && input.value.trim()) {
      input.value += ", " + spokenText;
    } else {
      input.value = spokenText;
    }
  };

  recognition.onerror = function () {
    alert("Voice input failed. Please try again.");
  };
}

function startVoiceSearch() {
  if (!SpeechRecognition) {
    alert("Voice recognition is not supported on this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = getLang();
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onresult = function (event) {
    const spokenText = event.results[0][0].transcript;
    document.getElementById("searchInput").value = spokenText;
    handleVoiceCommand(spokenText);
  };

  recognition.onerror = function () {
    alert("Voice search failed. Please try again.");
  };
}

function startVoiceAssistantMode() {
  if (!SpeechRecognition) {
    alert("Voice assistant is not supported on this browser.");
    return;
  }

  voiceAssistantActive = true;
  listenContinuously();
  speak("Voice assistant started. You can ask Locivio where something is.");
}

function stopVoiceAssistantMode() {
  voiceAssistantActive = false;

  if (activeRecognition) {
    activeRecognition.stop();
  }

  speak("Voice assistant stopped.");
}

function listenContinuously() {
  if (!voiceAssistantActive) return;

  activeRecognition = new SpeechRecognition();
  activeRecognition.lang = getLang();
  activeRecognition.interimResults = false;
  activeRecognition.maxAlternatives = 1;

  activeRecognition.start();

  activeRecognition.onresult = function (event) {
    const spokenText = event.results[0][0].transcript;
    handleVoiceCommand(spokenText);
  };

  activeRecognition.onerror = function () {
    if (voiceAssistantActive) {
      setTimeout(listenContinuously, 1200);
    }
  };

  activeRecognition.onend = function () {
    if (voiceAssistantActive) {
      setTimeout(listenContinuously, 800);
    }
  };
}

function handleVoiceCommand(text) {
  const command = text.toLowerCase();

  if (
    command.includes("go home") ||
    command.includes("home") ||
    command.includes("dashboard")
  ) {
    showScreen("appScreen");
    speak("Opening home dashboard.");
    return;
  }

  if (
    command.includes("favorite") ||
    command.includes("favorites") ||
    command.includes("emergency")
  ) {
    const favoritesBox = document.getElementById("favoritesBox");
    if (favoritesBox) {
      favoritesBox.scrollIntoView({ behavior: "smooth" });
    }
    speak("Opening favorites.");
    return;
  }

  if (
    command.includes("search") ||
    command.includes("find") ||
    command.includes("where")
  ) {
    document.getElementById("searchInput").value = text;
    searchItems(true);
    return;
  }

  document.getElementById("searchInput").value = text;
  searchItems(true);
}

function speak(text) {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = getLang();
  speech.rate = 0.95;
  speech.pitch = 1;

  window.speechSynthesis.speak(speech);
}

function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
