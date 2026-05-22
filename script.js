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
const fields = ["humeur", "discussions", "dates"];

// ===== ÉLÉMENTS =====
const syncStatus = document.getElementById("sync-status");
const toast = document.getElementById("toast");

// ===== TOAST =====
let toastTimer = null;
function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

// ===== AFFICHAGE =====
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

// ===== ÉCOUTE TEMPS RÉEL — au chargement ET à chaque changement depuis l'autre appareil =====
onSnapshot(sharedDoc, (snapshot) => {
    syncStatus.textContent = "🟢 Synchronisé en temps réel";

    if (!snapshot.exists()) {
        fields.forEach((field) => updateDisplay(field, ""));
        return;
    }

    const data = snapshot.data();

    fields.forEach((field) => {
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

}, (error) => {
    // ⚠️ Erreur la plus fréquente : règles Firestore trop restrictives
    console.error("Erreur Firestore :", error.code, error.message);
    syncStatus.textContent = "🔴 Hors ligne";

    if (error.code === "permission-denied") {
        showToast("🔒 Accès refusé — vérifie les règles Firestore");
        syncStatus.textContent = "🔒 Règles Firestore bloquantes";
    } else {
        showToast("⚠️ Connexion perdue : " + error.code);
    }
});

// ===== SAISIE : affichage instantané + auto-save après 1,5s d'inactivité =====
const autoSaveTimers = {};

fields.forEach((field) => {
    const textarea = document.getElementById(field);
    const counter  = document.getElementById(`count-${field}`);

    if (!textarea) return;

    textarea.addEventListener("input", () => {
        // Compteur et affichage instantané
        if (counter) counter.textContent = textarea.value.length;
        updateDisplay(field, textarea.value);

        // Auto-save déboncé (1,5s après la dernière frappe)
        clearTimeout(autoSaveTimers[field]);
        autoSaveTimers[field] = setTimeout(() => saveToFirebase(field), 1500);
    });
});

// ===== SAUVEGARDE FIREBASE =====
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

// Bouton manuel : annule l'auto-save en cours et sauvegarde immédiatement
window.saveField = function(field) {
    clearTimeout(autoSaveTimers[field]);
    saveToFirebase(field);
};
