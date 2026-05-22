// ─────────────────────────────────────────
//   NOTRE PETIT COCON — script.js
//   Firebase Firestore · Realtime sync
// ─────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ── Firebase config ──
const firebaseConfig = {
    apiKey: "AIzaSyBRgdkK4GebTOizF7O3OGaOaPJLYyu1UVA",
    authDomain: "couple-768a9.firebaseapp.com",
    projectId: "Tcouple-768a9",
    storageBucket: "couple-768a9.firebasestorage.app",
    messagingSenderId: "806640890987",
    appId: "1:806640890987:web:ebdb42cc601e95e477ad2e"
};

// ── Init ──
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const ref = doc(db, "couple", "notes");

// ── Character counters ──
const fields = ['humeur', 'discussions', 'dates'];

fields.forEach(id => {
    const ta    = document.getElementById(id);
    const count = document.getElementById(`count-${id}`);

    if (!ta || !count) return;

    ta.addEventListener('input', () => {
        count.textContent = ta.value.length;
        count.style.color = ta.value.length > 300 ? '#e86097' : '';
    });
});

// ── Toast notification ──
function showToast(msg = '💖 Sauvegardé avec amour !') {
    const toast = document.getElementById('toast');
    const msgEl = toast.querySelector('.toast-msg');
    if (msgEl) msgEl.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── Ripple on button click ──
function addRipple(btn, e) {
    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height) * 1.5;
    const x      = (e.clientX - rect.left) - size / 2;
    const y      = (e.clientY - rect.top)  - size / 2;
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
}

// ── Save function ──
window.save = async function(field) {
    const ta  = document.getElementById(field);
    const btn = document.getElementById(`btn-${field}`);
    if (!ta || !btn) return;

    const value = ta.value.trim();

    // Ripple on the last click coordinates (center fallback)
    addRipple(btn, { clientX: btn.getBoundingClientRect().left + btn.offsetWidth / 2,
                     clientY: btn.getBoundingClientRect().top  + btn.offsetHeight / 2 });

    // Optimistic UI: saved state
    const originalText = btn.querySelector('.btn-text').textContent;
    btn.classList.add('saved');
    btn.querySelector('.btn-text').textContent = 'Sauvegardé !';
    btn.querySelector('.btn-icon').textContent = '✓';
    btn.disabled = true;

    try {
        await setDoc(ref, { [field]: value }, { merge: true });
        showToast('💖 Sauvegardé avec amour !');
    } catch (err) {
        console.error('Erreur Firestore :', err);
        showToast('❌ Oups, une erreur est survenue…');
    } finally {
        setTimeout(() => {
            btn.classList.remove('saved');
            btn.querySelector('.btn-text').textContent = originalText;
            btn.querySelector('.btn-icon').textContent = '✦';
            btn.disabled = false;
        }, 2000);
    }
};

// ── Realtime sync from Firestore ──
onSnapshot(ref, (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.data();

    fields.forEach(id => {
        const ta    = document.getElementById(id);
        const count = document.getElementById(`count-${id}`);
        if (!ta) return;

        // Only update if content differs (avoid cursor jump while typing)
        if (data[id] !== undefined && ta.value !== data[id]) {
            ta.value = data[id];
            if (count) count.textContent = data[id].length;
        }
    });
}, (err) => {
    console.error('Erreur de synchronisation :', err);
});
