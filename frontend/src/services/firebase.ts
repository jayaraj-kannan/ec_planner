import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY || import.meta.env.FIREBASE_APIKEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN || import.meta.env.FIREBASE_AUTHDOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECTID || import.meta.env.FIREBASE_PROJECTID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET || import.meta.env.FIREBASE_STORAGEBUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGINGSENDERID || import.meta.env.FIREBASE_MESSAGINGSENDERID || '',
  appId: import.meta.env.VITE_FIREBASE_APPID || import.meta.env.FIREBASE_APPID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENTID || import.meta.env.FIREBASE_MEASUREMENTID || '',
};

// Initialize Firebase once
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export const db = getFirestore(app);
