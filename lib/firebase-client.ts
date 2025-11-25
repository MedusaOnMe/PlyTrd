import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;

function initializeFirebase() {
  if (typeof window === 'undefined') {
    // Server-side: don't initialize client SDK
    return { app: null, auth: null };
  }

  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  return { app, auth };
}

const firebase = initializeFirebase();

export const clientApp = firebase.app;
export const clientAuth = firebase.auth;

// Auth helper functions
export async function signIn(email: string, password: string) {
  if (!clientAuth) throw new Error('Auth not initialized');
  return signInWithEmailAndPassword(clientAuth, email, password);
}

export async function signUp(email: string, password: string) {
  if (!clientAuth) throw new Error('Auth not initialized');
  return createUserWithEmailAndPassword(clientAuth, email, password);
}

export async function signOut() {
  if (!clientAuth) throw new Error('Auth not initialized');
  return firebaseSignOut(clientAuth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  if (!clientAuth) return () => {};
  return onAuthStateChanged(clientAuth, callback);
}

export async function getIdToken(): Promise<string | null> {
  if (!clientAuth?.currentUser) return null;
  return clientAuth.currentUser.getIdToken();
}
