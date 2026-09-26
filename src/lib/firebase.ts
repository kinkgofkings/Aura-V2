import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  signInAnonymously,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration loaded securely from environment variables.
// Sensitive client keys are stored in .env (git-ignored) and never committed to version control.
const env = import.meta.env;

const firebaseConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0754147916",
  appId: env.VITE_FIREBASE_APP_ID || "1:1084490663528:web:8da9a6e8e54cf3ffd29ddd",
  apiKey: env.VITE_FIREBASE_API_KEY || "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0754147916.firebaseapp.com",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0754147916.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1084490663528",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
const firestoreDatabaseId = env.VITE_FIREBASE_DATABASE_ID || "ai-studio-aurav2-4b529a4c-9ac3-4405-afd7-dd19d82e096a";
export const db = getFirestore(app, firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const githubProvider = new GithubAuthProvider();
export { signInAnonymously };
// TikTok requires custom OIDC setup which isn't standard in basic Firebase JS SDK without setup in console
// We will focus on the main ones: Email, Phone, Google, Facebook, Github

// Enforce email verification (this is done manually in AuthContext)