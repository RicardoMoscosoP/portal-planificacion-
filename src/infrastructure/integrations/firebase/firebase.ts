// firebase.ts — Inicialización condicional del SDK de Firebase
// Si las variables VITE_FIREBASE_* no están definidas (ej: build sin .env.local),
// la app funciona en modo sin-Firebase: datos vienen del GASRepository / Mock.
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;

export let app: FirebaseApp | null = null;
export let db:   Firestore | null = null;
export let auth: Auth      | null = null;

if (apiKey) {
  const firebaseConfig = {
    apiKey,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        as string,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         as string,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID             as string,
  };
  app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db   = getFirestore(app);
  auth = getAuth(app);
}
