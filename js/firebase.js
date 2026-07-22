// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDX30YZ5lZa5rJpuMiznFaL6MTry8Ketyg",
    authDomain: "jkp-monitoring.firebaseapp.com",
    projectId: "jkp-monitoring",
    storageBucket: "jkp-monitoring.firebasestorage.app",
    messagingSenderId: "1044568208178",
    appId: "1:1044568208178:web:09ba71b275a8d96d699d2b",
    measurementId: "G-72NP6897DY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
