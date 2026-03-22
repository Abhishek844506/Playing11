// ===== FIREBASE SETUP =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB5clcnAFJySCK8V6bkOHQTgFT65XXNExw",
  authDomain: "predict11-fc129.firebaseapp.com",
  projectId: "predict11-fc129",
  storageBucket: "predict11-fc129.firebasestorage.app",
  messagingSenderId: "634146309603",
  appId: "1:634146309603:web:6be9a43a1f54f766134cd6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);