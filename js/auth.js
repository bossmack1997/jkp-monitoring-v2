// js/auth.js — Single Admin Authentication
import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getAuth
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { showToast } from "./utils.js";

const ADMIN_ROLE = "admin";

function mapError(err) {
  const code = err.code || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Invalid email or password.";
  }
  if (code.includes("too-many-requests")) {
    return "Too many attempts. Please try again later.";
  }
  return err.message || "Something went wrong. Please try again.";
}

function setSession(uid, name, remember) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("jkp_uid", uid);
  storage.setItem("jkp_name", name);
  storage.setItem("jkp_role", ADMIN_ROLE);
}

function clearSession() {
  sessionStorage.clear();
  localStorage.removeItem("jkp_uid");
  localStorage.removeItem("jkp_name");
  localStorage.removeItem("jkp_role");
}

function getSession() {
  const uid = sessionStorage.getItem("jkp_uid") || localStorage.getItem("jkp_uid");
  const name = sessionStorage.getItem("jkp_name") || localStorage.getItem("jkp_name");
  const role = sessionStorage.getItem("jkp_role") || localStorage.getItem("jkp_role");
  return { uid, name, role };
}

export async function loginUser(email, password, remember = false) {
  const cred = await signInWithEmailAndPassword(getAuth(), email, password);
  const userDoc = await getDoc(doc(db, "users", cred.user.uid));

  if (!userDoc.exists()) {
    await signOut(getAuth());
    throw new Error("Access denied. Admin account not found.");
  }

  const data = userDoc.data();
  if (data.role !== ADMIN_ROLE) {
    await signOut(getAuth());
    throw new Error("Access denied. Admin access only.");
  }

  setSession(cred.user.uid, data.fullname || data.name || email, remember);
  return ADMIN_ROLE;
}

export async function logoutUser() {
  await signOut(getAuth());
  clearSession();
  window.location.href = "login.html";
}

function waitForAuth() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function guardPage(currentPage) {
  const currentUser = getAuth().currentUser;

  let user = currentUser;
  if (!user) {
    user = await waitForAuth();
  }

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  let session = getSession();

  if (!session.role || session.role !== ADMIN_ROLE) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists() || userDoc.data().role !== ADMIN_ROLE) {
        await signOut(getAuth());
        clearSession();
        window.location.href = "login.html";
        return;
      }
      const data = userDoc.data();
      const remembered = localStorage.getItem("jkp_role") === ADMIN_ROLE;
      setSession(user.uid, data.fullname || data.name || user.email, remembered);
      session = getSession();
    } catch (e) {
      console.error("Auth check failed:", e);
      await signOut(getAuth());
      clearSession();
      window.location.href = "login.html";
      return;
    }
  }

  const nameEl = document.getElementById("userName");
  if (nameEl) {
    nameEl.textContent = session.name || "Admin";
  }
}

export function isLoggedIn() {
  return getSession().role === ADMIN_ROLE;
}
