import { auth } from "@/config/firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { create } from "zustand";

export const useAuth = create((set, get) => ({
  user: null,
  loading: true,
  init: () => onAuthStateChanged(auth, (u) => set({ user: u, loading: false })),
  signUpEmail: (email, pw) => createUserWithEmailAndPassword(auth, email, pw),
  signInEmail: (email, pw) => signInWithEmailAndPassword(auth, email, pw),
  signOut: () => signOut(auth),
  signInWithGoogleCredential: (credential) =>
    signInWithCredential(auth, credential),
}));
