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

// ===== DOCUMENT PARTAGÉ =====
const sharedDoc = doc(db, "shared_space", "main_data");

const fields = ["humeur", "discussions", "dates"];

// ===== ÉLÉMENTS =====
const syncStatus = document.getElementById("sync-status");
const toast = document.getElementById("toast");

// ===== COMPTEURS DE CARACTÈRES =====
fields.forEach((field) => {
    const textarea = document.getElementById(field);
    const counter = document.getElementById(`count-${field}`);

    if (textarea && counter) {
        textarea.addEventListener("input", () => {
            counter.textContent = textarea.value.length;
        });
    }
});

// ===== TOAST =====
let toastTimer = null;
function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// ===== MISE À JOUR DE L'AFFICHAGE =====
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

// ===== SAUVEGARDE =====
window.saveField = async function(field) {
    const textarea = document.getElementById(field);
    const button = document.getElementById(`btn-${field}`);

    if (!textarea || !button) return;

    const value = textarea.value.trim();

    button.disabled = true;
    button.classList.add("saved");
    button.textContent = "Sauvegardé ✓";

    try {
        await setDoc(
            sharedDoc,
            {
                [field]: value,
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );

        // Mise à jour immédiate de l'affichage
        updateDisplay(field, value);
        showToast("💖 Synchronisé avec succès");

    } catch (error) {
        console.error("Erreur Firebase :", error);
        showToast("❌ Erreur de connexion Firebase");

        button.disabled = false;
        button.classList.remove("saved");
        button.textContent = "Sauvegarder";
        return;
    }

    setTimeout(() => {
        button.disabled = false;
        button.classList.remove("saved");
        button.textContent = "Sauvegarder";
    }, 1500);
};

// ===== SYNCHRONISATION TEMPS RÉEL =====
onSnapshot(sharedDoc, (snapshot) => {

    syncStatus.textContent = "🟢 Synchronisé en temps réel";

    if (!snapshot.exists()) {
        // Document vide : tout réinitialiser
        fields.forEach((field) => updateDisplay(field, ""));
        return;
    }

    const data = snapshot.data();

    fields.forEach((field) => {
        const textarea = document.getElementById(field);
        const counter = document.getElementById(`count-${field}`);

        // Mise à jour du textarea uniquement si la valeur a changé
        // (pour ne pas écraser ce que l'utilisateur est en train de taper)
        if (textarea && data[field] !== undefined) {
            if (document.activeElement !== textarea) {
                textarea.value = data[field];
            }
            if (counter) {
                counter.textContent = textarea.value.length;
            }
        }

        // Toujours mettre à jour la zone d'affichage
        updateDisplay(field, data[field] ?? "");
    });

}, (error) => {
    console.error("Erreur snapshot :", error);
    syncStatus.textContent = "🔴 Hors ligne";
    showToast("⚠️ Connexion perdue");
});
