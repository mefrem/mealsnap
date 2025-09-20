# Build Plan v3 — Mealsnap (Expo + Firebase, JS, iOS)
**Context you already completed**
- In Firebase Console: enabled **Email/Password Auth**, **Google Auth**, **Firestore**.
- Pasted the generated config into `firebase.js`.
- Ran `npm install firebase` in the project.

**Goal**
Ship a minimal iOS prototype using **Expo (managed)** + **Expo Router**, plain **JavaScript**, **Firebase Auth (email + Google)**, **Firestore**, and **Storage for photos** (required for camera uploads per PRD).

---

## Milestone 0 — Sanity & Git
1) Verify app boots
```sh
npx expo start -c
```
2) Commit current state
```sh
git add . && git commit -m "chore: base with firebase config"
```

✅ *Acceptance:* Dev server starts; no import errors from `firebase.js`.

---

## Milestone 1 — Install deps & base scaffold
> Keep it lean and Expo-managed (no native modules beyond what Expo supports).

```sh
# Navigation & UI
npm i expo-router react-native-gesture-handler react-native-reanimated

# Camera + media + file utilities
npm i expo-camera expo-media-library expo-image-manipulator expo-file-system expo-sharing

# State & data
npm i @tanstack/react-query zustand

# Styling (optional but recommended)
npm i nativewind tailwindcss

# Dev tooling
npm i -D prettier eslint
```

Create minimal router files:
```
/app
  _layout.js
  index.js
  /auth
    login.js
    signup.js
  /camera
    capture.js
    review.js
  /history
    index.js
  /reports
    index.js
  /settings
    index.js
```

`app/_layout.js` (shell):
```js
import { Stack } from "expo-router";
import "react-native-gesture-handler";
export default function Layout(){ return <Stack />; }
```

`app/index.js` (placeholder):
```js
import { Link } from "expo-router";
import { View, Text } from "react-native";
export default function Home(){
  return (
    <View style={{padding:24}}>
      <Text>Mealsnap</Text>
      <Link href="/auth/login">Login</Link>
      <Link href="/camera/capture">Camera</Link>
      <Link href="/history">History</Link>
      <Link href="/reports">Reports</Link>
      <Link href="/settings">Settings</Link>
    </View>
  );
}
```

✅ *Acceptance:* Visiting each route shows a placeholder screen.

---

## Milestone 2 — Organize Firebase module
Put your config into `/config/firebase.js` (move if currently in project root). Export services for reuse and future tree-shaking.

`/config/firebase.js`
```js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Paste your existing firebaseConfig here:
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
```

✅ *Acceptance:* `import { auth, db, storage } from "@/config/firebase"` works anywhere.

---

## Milestone 3 — Auth flows (Email + Google)
Create `/state/useAuth.js` (Zustand + Firebase):
```js
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
  init: () => onAuthStateChanged(auth, (u)=> set({ user: u, loading: false })),
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
```

Screens:
- `/app/auth/login.js` – email login + Google button, link to signup.
- `/app/auth/signup.js` – email signup + back to login.
- Guard other routes: if no `user`, redirect to `/auth/login`.

✅ *Acceptance:* Email and Google login succeed on iOS simulator; auth state persists on reload.

---

## Milestone 4 — Data model & security
**Firestore**
- `users/{uid}`
- `meals/{uid}/items/{mealId}`
  - `createdAt` (serverTimestamp)
  - `photoStoragePath` (string)
  - `ai` `{ items: [{name, grams, kcal, protein, carbs, fat, confidence?}], total: {kcal, protein, carbs, fat} }`
  - `manualAdjustments` (object|null)
  - `notes` (string|null)

Create rules files:

`/firebase/firestore.rules`
```
// Owner-only access
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /meals/{uid}/items/{mealId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

`/firebase/storage.rules`
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{uid}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Publish rules (either via Console or CLI later).

✅ *Acceptance:* Non-owner reads/writes are denied; owner allowed.

---

## Milestone 5 — Camera → Review → Save
`/app/camera/capture.js`
- Request `Camera` + `MediaLibrary` permissions.
- Show camera preview; on capture, navigate to `/camera/review` with `localUri`.

`/app/camera/review.js`
- Display the captured image.
- Call `analyzePhotoAsync(localUri)` from `/lib/aiStub.js` (stubbed inference).
- Render editable list of items and live-updated totals.
- On **Save**:
  1. Upload file to `images/{uid}/{mealId}.jpg` (via `uploadBytesResumable` from `firebase/storage`).
  2. Create Firestore doc with fields described above.

✅ *Acceptance:* Snap → review with AI stub in ≤2s → save → shows in history.

---

## Milestone 6 — AI Vision Stub (prototype)
`/lib/aiStub.js`
```js
export async function analyzePhotoAsync(localUri){
  await new Promise(r => setTimeout(r, 1200));
  // Return plausible, editable defaults
  const items = [
    { name: "Chicken breast", grams: 150, kcal: 240, protein: 45, carbs: 0, fat: 5, confidence: 0.7 },
    { name: "Rice", grams: 180, kcal: 230, protein: 5, carbs: 50, fat: 1, confidence: 0.6 },
    { name: "Broccoli", grams: 90, kcal: 30, protein: 3, carbs: 6, fat: 0, confidence: 0.8 },
  ];
  const total = items.reduce((t,i)=>({
    kcal: t.kcal+i.kcal, protein:t.protein+i.protein, carbs:t.carbs+i.carbs, fat:t.fat+i.fat
  }), {kcal:0,protein:0,carbs:0,fat:0});
  return { items, total };
}
```

✅ *Acceptance:* Stub returns within ~1–2s and totals recompute when items are edited.

---

## Milestone 7 — History & Detail
`/app/history/index.js`
- Query `meals/{uid}/items` ordered `createdAt desc` (paged).
- List cards w/ thumbnail, kcal total, time.
- Tap → modal with full photo + items + notes.

✅ *Acceptance:* New entry appears immediately; pagination loads older meals.

---

## Milestone 8 — Reports (+ CSV export)
`/app/reports/index.js`
- Filter chips: **Today / 7d / 30d**.
- Query meals in range; sum totals client-side (prototype OK).
- CSV export via `/lib/csv.js` + `expo-sharing`.

`/lib/csv.js`
```js
export function buildMealsCsv(rows){
  const header = ["datetime","kcal","protein","carbs","fat"].join(",");
  const body = rows.map(r => [
    r.createdAt?.toDate?.().toISOString?.() ?? "",
    r.ai?.total?.kcal ?? 0,
    r.ai?.total?.protein ?? 0,
    r.ai?.total?.carbs ?? 0,
    r.ai?.total?.fat ?? 0,
  ].join(",")).join("\n");
  return header + "\n" + body + "\n";
}
```

✅ *Acceptance:* Totals match history; CSV opens in iOS share sheet and looks correct in Numbers/Excel.

---

## Milestone 9 — State & Caching
`/state/queryClient.js` create a React Query client; wrap `_layout.js` with provider.
`/state/useMeals.js` expose `addMeal`, `listMeals`, `getMealsByRange` with caching and simple optimistic UI for add.

✅ *Acceptance:* Navigating back to Reports shows cached totals then revalidates without flicker.

---

## Milestone 10 — Settings
`/app/settings/index.js`
- Show current user email.
- Buttons: **Sign out**, **Delete my data** (danger; iterate through user meals & images).

✅ *Acceptance:* Sign-out returns to `/auth/login` and clears state.

---

## Milestone 11 — iOS run & smoke test
- Simulator run:
```sh
npx expo run:ios
```
- Smoke path: Login → Camera → Review (AI stub) → Save → History → Reports → CSV export.

✅ *Acceptance:* End-to-end happy path completes without red screens.

---

## Copy/Paste prompts for Cursor
**P0 — Router & placeholders**
> Add Expo Router with `_layout.js` and the folders/pages listed. Ensure each page renders a basic view and links exist from the home screen.

**P1 — Firebase module**
> Move existing Firebase config into `/config/firebase.js` and export `auth`, `db`, `storage`, `googleProvider` per snippet.

**P2 — Auth screens & store**
> Implement `/state/useAuth.js` (email+Google) and `/app/auth/login.js`, `/app/auth/signup.js`. Redirect unauthenticated users to login.

**P3 — Firestore & Storage rules**
> Create `/firebase/firestore.rules` and `/firebase/storage.rules` exactly as specified.

**P4 — Camera → Review → Save**
> Implement capture and review screens; wire `analyzePhotoAsync`; upload to Storage and create Firestore doc.

**P5 — History & Reports (+ CSV)**
> Implement history list with pagination and reports page with Today/7d/30d filters and CSV export.

**P6 — Settings & polish**
> Add sign-out and danger delete; integrate React Query provider and meal hooks; do a simulator smoke test.
