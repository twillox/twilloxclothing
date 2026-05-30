import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if credentials exist, log an alert if not to assist the developer
const isConfigValid = 
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.authDomain;

if (!isConfigValid && typeof window !== 'undefined') {
  console.warn(
    "⚠️ FIREBASE CREDENTIALS MISSING: Please define NEXT_PUBLIC_FIREBASE_* variables in your .env.local file. " +
    "Check your Firebase Console to retrieve these values."
  );
}

// Fallback placeholder credentials for local compilation checks (does not connect but prevents initialization crashes)
const fallbackConfig = {
  apiKey: firebaseConfig.apiKey || "AIzaSyDummyKey-ForCompilationOnly",
  authDomain: firebaseConfig.authDomain || "twillox-dummy.firebaseapp.com",
  projectId: firebaseConfig.projectId || "twillox-dummy",
  storageBucket: firebaseConfig.storageBucket || "twillox-dummy.appspot.com",
  messagingSenderId: firebaseConfig.messagingSenderId || "1234567890",
  appId: firebaseConfig.appId || "1:12345:web:dummy"
};

const app = getApps().length === 0 ? initializeApp(fallbackConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
export default app;
