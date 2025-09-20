# Product Requirements Document (PRD)

**Product Name:** Mealsnap
**Version:** Draft 1.0
**Date:** September 19, 2025

---

## 1. Overview

**Purpose**
Enable effortless nutrition tracking via photos. The app allows users to snap pictures of meals, automatically estimates calories and macronutrients, stores this data, and generates reports and trends.

**Problem Statement**
Manual calorie logging is tedious and error-prone. Users want a faster and simpler way to track their meals and nutrition.

**Goals & Objectives**

- Let users capture meals with photos.
- Use AI vision to estimate calories/macros.
- Store meal data securely.
- Provide reports and trend insights.

---

## 2. Key Features

1. **Photo Capture & Upload**: In-app camera or gallery import; support multiple angles/photos.
2. **AI Vision Analysis**: Detect food items, estimate portion sizes, return calorie/macro data; allow manual edits.
3. **Data Storage**: Firebase Firestore database; meals linked to users; photos in Firebase Storage.
4. **Reports & Analytics**: Summaries by day/week/month; charts; exportable CSV/PDF.
5. **Trends & Insights**: Identify patterns, frequent meals, and nutrition habits.

---

## 3. User Stories

- As a user, I want to take a photo of my meal and see calories/macros instantly.
- As a user, I want to correct AI mistakes for accuracy.
- As a user, I want to see nutrition summaries over time.
- As a user, I want to export my meal history.

---

## 4. Functional Requirements

- AI analysis latency ≤ 2s.
- Accuracy ≥ 80% on common foods (prototype: stub values).
- Firestore stores user meal history with photo references.
- Reports update dynamically with new meals.

---

## 5. Non-Functional Requirements

- **Performance:** Fast inference, smooth UX.
- **Security & Privacy:** Firebase Auth; per-user Firestore rules; encrypted storage.
- **Scalability:** Handle up to 1M users.
- **Cross-Platform:** iOS + Android via Expo React Native.

---

## 6. Tech Stack

- **Mobile:** Expo React Native, Nativewind, React Query, Zustand.
- **Backend:** Firebase (Auth, Firestore, Storage, Functions).
- **AI Vision:** Prototype stub via Cloud Function; future integration of ML model.

---

## 7. Success Metrics

- Meals logged per user/week ≥ 10.
- Retention ≥ 40% at day 30.
- AI accuracy ≥ 85% on future model.
- App store rating ≥ 4.5.

---

## 8. Risks & Mitigations

- **Misclassification:** Allow manual corrections; collect feedback.
- **Privacy concerns:** Enforce strict Firebase rules; provide data deletion endpoint.
- **High compute costs:** Stub model for prototype; optimize later.

---
