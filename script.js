// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// CONFIG FIREBASE (à remplacer par tes infos)
const firebaseConfig = {
    apiKey: "AIzaSyBRgdkK4GebTOizF7O3OGaOaPJLYyu1UVA",
    authDomain: "couple-768a9.firebaseapp.com",
    projectId: "Tcouple-768a9",
    storageBucket: "couple-768a9.firebasestorage.app",
    messagingSenderId: "806640890987",
    appId: "1:806640890987:web:ebdb42cc601e95e477ad2e"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fonction de sauvegarde
window.save = async function(field) {
    const value = document.getElementById(field).value;

    await setDoc(doc(db, "couple", "notes"), {
        [field]: value
    }, { merge: true });

    alert("💖 Sauvegardé !");
};

// Chargement automatique en temps réel
onSnapshot(doc(db, "couple", "notes"), (snapshot) => {
    const data = snapshot.data();
    if (!data) return;

    if (data.humeur) document.getElementById("humeur").value = data.humeur;
    if (data.discussions) document.getElementById("discussions").value = data.discussions;
    if (data.dates) document.getElementById("dates").value = data.dates;
});
