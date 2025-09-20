import { create } from "zustand";
import { auth } from "@/config/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithCredential,
  GoogleAuthProvider
} from "firebase/auth";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export const useAuth = create((set, get) => ({
  user: null,
  loading: true,
  init: () => onAuthStateChanged(auth, (u) => set({ user: u, loading: false })),
  signUpEmail: (email, pw) => createUserWithEmailAndPassword(auth, email, pw),
  signInEmail: (email, pw) => signInWithEmailAndPassword(auth, email, pw),
  signOut: () => signOut(auth),
  signInWithGoogle: async () => {
    const [request, response, promptAsync] = Google.useAuthRequest({
      iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    });
    const res = await promptAsync();
    const idToken = res?.authentication?.idToken;
    if (!idToken) throw new Error("No Google ID token");
    const credential = GoogleAuthProvider.credential(idToken);
    return signInWithCredential(auth, credential);
  }
}));
