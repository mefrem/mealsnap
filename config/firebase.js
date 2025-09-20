import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD47o2l6dLAk2Syc6KvR81IcoxGstx8b7k",
  authDomain: "mealsnap-public.firebaseapp.com",
  projectId: "mealsnap-public",
  storageBucket: "mealsnap-public.firebasestorage.app",
  messagingSenderId: "267069773273",
  appId: "1:267069773273:web:92a1c3d4534f31344bf5c8",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
