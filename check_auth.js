import { initializeApp } from "firebase/app";
import { getAuth, fetchSignInMethodsForEmail } from "firebase/auth";

const firebaseConfig = {
  projectId: "gen-lang-client-0754147916",
  appId: "1:1084490663528:web:8da9a6e8e54cf3ffd29ddd",
  apiKey: "AIzaSyD4eagbCNPz-3_vLu3TTaOiHEAn-vmHonI",
  authDomain: "gen-lang-client-0754147916.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function check() {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, "lightsouttattootex@gmail.com");
    console.log("Sign-in methods for lightsouttattootex@gmail.com:", methods);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
check();
