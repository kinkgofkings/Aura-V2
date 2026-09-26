import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  signInAnonymously,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0754147916",
  appId: "1:1084490663528:web:8da9a6e8e54cf3ffd29ddd",
  apiKey: "AIzaSyD4eagbCNPz-3_vLu3TTaOiHEAn-vmHonI",
  authDomain: "gen-lang-client-0754147916.firebaseapp.com",
  storageBucket: "gen-lang-client-0754147916.firebasestorage.app",
  messagingSenderId: "1084490663528",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-aurav2-4b529a4c-9ac3-4405-afd7-dd19d82e096a");

export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const githubProvider = new GithubAuthProvider();
export { signInAnonymously };
// TikTok requires custom OIDC setup which isn't standard in basic Firebase JS SDK without setup in console
// We will focus on the main ones: Email, Phone, Google, Facebook, Github

// Enforce email verification (this is done manually in AuthContext)