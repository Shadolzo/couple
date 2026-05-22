import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    doc,
    setDoc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===== CONFIG FIREBASE =====
const firebaseConfig = {
    apiKey: "AIzaSyBRgdkK4GebTOizF7O3OGaOaPJLYyu1UVA",
    authDomain: "couple-768a9.firebaseapp.com",
    projectId: "couple-768a9",
    storageBucket: "couple-768a9.appspot.com",
    messagingSenderId: "806640890987",
    appId: "1:806640890987:web:ebdb42cc601e95e477ad2e"
};

// ===== INITIALISATION =====
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const sharedDoc = doc(db, "shared_space", "main_data");

// Champs texte uniquement (humeur est géré séparément via emojis)
const textFields = ["discussions", "dates"];

// ===== ÉLÉMENTS =====
const syncStatus = document.getElementById("sync-status");
const toast = document.getElementById("toast");

// ===== ÉTAT LOCAL =====
let currentHumeur = "";

// ===== TOAST =====
let toastTimer = null;
function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

// ===== MISE À JOUR AFFICHAGE TEXTE =====
function updateDisplay(field, value) {
    const displayEl = document.getElementById(`display-${field}`);
    if (!displayEl) return;
    if (!value || value.trim() === "") {
        displayEl.textContent = "Rien pour le moment...";
        displayEl.classList.add("empty");
    } else {
        displayEl.textContent = value;
        displayEl.classList.remove("empty");
    }
}

// ===== MISE À JOUR AFFICHAGE HUMEUR (emoji) =====
function updateHumeurDisplay(emoji) {
    // Affichage dans le panel droit
    const displayEl = document.getElementById("display-humeur");
    if (displayEl) {
        if (!emoji || emoji.trim() === "") {
            displayEl.textContent = "Rien pour le moment...";
            displayEl.classList.add("empty");
        } else {
            displayEl.textContent = emoji;
            displayEl.classList.remove("empty");
        }
    }

    // Highlight du bouton sélectionné dans le picker
    document.querySelectorAll(".emoji-btn").forEach(btn => {
        btn.classList.toggle("selected", btn.dataset.emoji === emoji);
    });

    currentHumeur = emoji || "";
}

// ===== ÉCOUTE TEMPS RÉEL =====
onSnapshot(sharedDoc, (snapshot) => {
    syncStatus.textContent = "🟢 Synchronisé en temps réel";

    if (!snapshot.exists()) {
        textFields.forEach(field => updateDisplay(field, ""));
        updateHumeurDisplay("");
        return;
    }

    const data = snapshot.data();

    // Mise à jour des champs texte
    textFields.forEach(field => {
        const textarea = document.getElementById(field);
        const counter  = document.getElementById(`count-${field}`);
        const value    = data[field] ?? "";

        // Ne pas écraser ce que l'utilisateur est en train de taper
        if (textarea && document.activeElement !== textarea) {
            textarea.value = value;
            if (counter) counter.textContent = value.length;
        }

        updateDisplay(field, value);
    });

    // Mise à jour de l'humeur (emoji)
    const humeurValue = data["humeur"] ?? "";
    updateHumeurDisplay(humeurValue);

}, (error) => {
    console.error("Erreur Firestore :", error.code, error.message);
    syncStatus.textContent = "🔴 Hors ligne";

    if (error.code === "permission-denied") {
        showToast("🔒 Accès refusé — vérifie les règles Firestore");
        syncStatus.textContent = "🔒 Règles Firestore bloquantes";
    } else {
        showToast("⚠️ Connexion perdue : " + error.code);
    }
});

// ===== SÉLECTION D'UN EMOJI HUMEUR =====
async function saveHumeur(emoji) {
    // Si on reclique sur le même emoji, on le désélectionne
    const newValue = (emoji === currentHumeur) ? "" : emoji;

    // Mise à jour optimiste immédiate de l'UI
    updateHumeurDisplay(newValue);

    try {
        await setDoc(
            sharedDoc,
            { humeur: newValue, updatedAt: serverTimestamp() },
            { merge: true }
        );
        showToast(newValue ? `Humeur : ${newValue}` : "Humeur effacée");
    } catch (error) {
        console.error("Erreur écriture Firebase :", error.code, error.message);
        // Rollback visuel en cas d'erreur
        updateHumeurDisplay(currentHumeur);
        if (error.code === "permission-denied") {
            showToast("🔒 Écriture refusée — vérifie les règles Firestore");
        } else {
            showToast("❌ Erreur : " + error.code);
        }
    }
}

// Exposition globale pour les boutons emoji
window.saveHumeur = saveHumeur;

// ===== SAISIE TEXTE : auto-save après 1,5s d'inactivité =====
const autoSaveTimers = {};

textFields.forEach(field => {
    const textarea = document.getElementById(field);
    const counter  = document.getElementById(`count-${field}`);

    if (!textarea) return;

    textarea.addEventListener("input", () => {
        if (counter) counter.textContent = textarea.value.length;
        updateDisplay(field, textarea.value);

        clearTimeout(autoSaveTimers[field]);
        autoSaveTimers[field] = setTimeout(() => saveToFirebase(field), 1500);
    });
});

// ===== SAUVEGARDE FIREBASE (champs texte) =====
async function saveToFirebase(field) {
    const textarea = document.getElementById(field);
    const button   = document.getElementById(`btn-${field}`);
    if (!textarea) return;

    const value = textarea.value.trim();

    if (button) {
        button.disabled = true;
        button.classList.add("saved");
        button.textContent = "Sauvegardé ✓";
    }

    // Mise à jour optimiste immédiate
    updateDisplay(field, value);

    try {
        await setDoc(
            sharedDoc,
            { [field]: value, updatedAt: serverTimestamp() },
            { merge: true }
        );
        showToast("💖 Synchronisé avec succès");
    } catch (error) {
        console.error("Erreur écriture Firebase :", error.code, error.message);
        if (error.code === "permission-denied") {
            showToast("🔒 Écriture refusée — vérifie les règles Firestore");
        } else {
            showToast("❌ Erreur : " + error.code);
        }
    }

    setTimeout(() => {
        if (button) {
            button.disabled = false;
            button.classList.remove("saved");
            button.textContent = "Sauvegarder";
        }
    }, 1500);
}

// Bouton manuel : annule l'auto-save et sauvegarde immédiatement
window.saveField = function(field) {
    clearTimeout(autoSaveTimers[field]);
    saveToFirebase(field);
};
