import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  signInAnonymously,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration loaded securely from environment variables.
const env = import.meta.env;

const rawApiKey = (env.VITE_FIREBASE_API_KEY || '').trim();

// Check if API key is a genuine, properly formatted Google API key
export const isFirebaseConfigured = Boolean(
  rawApiKey &&
  rawApiKey.length > 25 &&
  rawApiKey.startsWith('AIza') &&
  !rawApiKey.includes('YOUR_FIREBASE_API_KEY') &&
  !rawApiKey.includes('000000000000') &&
  !rawApiKey.includes(':')
);

let app: any = null;
let authInstance: any = null;
let dbInstance: any = null;

if (isFirebaseConfigured) {
  const firebaseConfig = {
    projectId: env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0754147916",
    appId: env.VITE_FIREBASE_APP_ID || "1:1084490663528:web:8da9a6e8e54cf3ffd29ddd",
    apiKey: rawApiKey,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0754147916.firebaseapp.com",
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0754147916.firebasestorage.app",
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1084490663528",
  };

  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
  } catch (initErr) {
    console.warn('[Firebase] App initialization warning:', initErr);
  }

  if (app) {
    try {
      authInstance = getAuth(app);
    } catch (authErr) {
      console.warn('[Firebase Auth] Failed to initialize getAuth:', authErr);
      authInstance = null;
    }

    try {
      const firestoreDatabaseId = env.VITE_FIREBASE_DATABASE_ID || "ai-studio-aurav2-4b529a4c-9ac3-4405-afd7-dd19d82e096a";
      dbInstance = getFirestore(app, firestoreDatabaseId);
    } catch (dbErr) {
      console.warn('[Firebase Firestore] Failed to initialize Firestore:', dbErr);
      dbInstance = {};
    }
  }
}

// Resilient fallback auth object if Firebase is unconfigured or failed to initialize
if (!authInstance) {
  authInstance = {
    currentUser: null,
    onAuthStateChanged: (_a: any, callback: any, errorCallback?: any) => {
      try {
        if (typeof callback === 'function') {
          setTimeout(() => callback(null), 0);
        }
      } catch (err) {
        if (typeof errorCallback === 'function') errorCallback(err);
      }
      return () => {};
    },
    signOut: async () => {},
  };
}

if (!dbInstance) {
  dbInstance = {};
}

export const auth = authInstance;
export const db = dbInstance;

export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const githubProvider = new GithubAuthProvider();
export { signInAnonymously };