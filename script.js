import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    doc,
    setDoc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// CONFIG FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBRgdkK4GebTOizF7O3OGaOaPJLYyu1UVA",
    authDomain: "couple-768a9.firebaseapp.com",
    projectId: "couple-768a9",
    storageBucket: "couple-768a9.appspot.com",
    messagingSenderId: "806640890987",
    appId: "1:806640890987:web:ebdb42cc601e95e477ad2e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const sharedDoc = doc(db, "shared_space", "main_data");

// Champs texte classiques (textarea)
const textFields = ["discussions", "dates"];
// Tous les champs (y compris humeur)
const allFields = ["humeur", "discussions", "dates"];

const syncStatus = document.getElementById("sync-status");
const toast = document.getElementById("toast");

// --- COMPTEURS pour les textareas ---
textFields.forEach((field) => {
    const textarea = document.getElementById(field);
    const counter = document.getElementById(`count-${field}`);
    if (textarea && counter) {
        textarea.addEventListener("input", () => {
            counter.textContent = textarea.value.length;
        });
    }
});

// --- SÉLECTEUR D'HUMEUR ---
window.selectMood = function(btn) {
    // Désélectionner les autres
    document.querySelectorAll(".mood-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Mettre à jour le champ caché
    const mood = btn.dataset.mood;
    document.getElementById("humeur").value = mood;

    // Mettre à jour le label
    const label = document.getElementById("mood-label");
    if (label) label.textContent = `Sélectionné : ${mood}`;
};

// --- TOAST ---
function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}

// --- SAUVEGARDE ---
window.saveField = async function(field) {
    const input = document.getElementById(field);
    const button = document.getElementById(`btn-${field}`);
    if (!input || !button) return;

    const value = input.value.trim();
    if (!value) {
        showToast("⚠️ Rien à sauvegarder");
        return;
    }

    button.disabled = true;
    button.classList.add("saved");
    button.textContent = "Sauvegardé ✓";

    try {
        await setDoc(
            sharedDoc,
            { [field]: value, updatedAt: serverTimestamp() },
            { merge: true }
        );
        showToast("💖 Synchronisé avec succès");
    } catch (error) {
        console.error(error);
        showToast("❌ Erreur Firebase");
    }

    setTimeout(() => {
        button.disabled = false;
        button.classList.remove("saved");
        button.textContent = "Sauvegarder";
    }, 1500);
};

// --- SYNCHRONISATION TEMPS RÉEL ---
// FIX : on met à jour AUSSI les zones d'affichage (display-*)
onSnapshot(sharedDoc, (snapshot) => {
    syncStatus.textContent = "🟢 Synchronisé en temps réel";

    if (!snapshot.exists()) return;

    const data = snapshot.data();

    allFields.forEach((field) => {
        // Zone d'affichage → toujours mise à jour
        const display = document.getElementById(`display-${field}`);
        if (display) {
            display.textContent = data[field] || "Rien pour le moment...";
        }

        if (field === "humeur") {
            // Mettre à jour le champ caché
            const input = document.getElementById("humeur");
            if (input) input.value = data[field] || "";

            // Resélectionner le bon bouton
            const label = document.getElementById("mood-label");
            document.querySelectorAll(".mood-btn").forEach(btn => {
                btn.classList.remove("active");
                if (data[field] && btn.dataset.mood === data[field]) {
                    btn.classList.add("active");
                    if (label) label.textContent = `Sélectionné : ${data[field]}`;
                }
            });
        } else {
            // Textarea classique
            const textarea = document.getElementById(field);
            const counter = document.getElementById(`count-${field}`);
            if (textarea && data[field] !== undefined) {
                textarea.value = data[field];
                if (counter) counter.textContent = data[field].length;
            }
        }
    });

}, (error) => {
    console.error(error);
    syncStatus.textContent = "🔴 Hors ligne";
});
