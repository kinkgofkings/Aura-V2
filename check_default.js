import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0754147916",
  appId: "1:1084490663528:web:8da9a6e8e54cf3ffd29ddd",
  apiKey: "AIzaSyD4eagbCNPz-3_vLu3TTaOiHEAn-vmHonI",
  authDomain: "gen-lang-client-0754147916.firebaseapp.com",
  storageBucket: "gen-lang-client-0754147916.firebasestorage.app",
  messagingSenderId: "1084490663528",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Default DB

async function check() {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    snapshot.forEach(doc => {
      console.log(`[DEFAULT DB] UID: ${doc.id} | Email: ${doc.data().email}`);
    });
  } catch (e) { console.log(e.message); }
  process.exit(0);
}
check();
