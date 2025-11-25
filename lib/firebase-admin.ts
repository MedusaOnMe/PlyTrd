import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App;
let db: Firestore;
let auth: Auth;

function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
      throw new Error('Missing Firebase Admin credentials in environment variables');
    }

    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  } else {
    app = getApps()[0];
  }

  db = getFirestore(app);
  auth = getAuth(app);

  return { app, db, auth };
}

// Initialize on import
const firebase = initializeFirebaseAdmin();

export const adminApp = firebase.app;
export const adminDb = firebase.db;
export const adminAuth = firebase.auth;

// User document interface
export interface UserDocument {
  id: string;
  email: string;
  createdAt: FirebaseFirestore.Timestamp;
  wallet?: {
    address: string;
    encryptedPrivateKey: string;
    iv: string;
    salt: string;
    tag: string;
  };
  polymarketCreds?: {
    encryptedApiKey: string;
    encryptedSecret: string;
    encryptedPassphrase: string;
  };
  allowancesSet?: boolean;
}

// Helper functions for Firestore operations
export async function getUserById(userId: string): Promise<UserDocument | null> {
  const doc = await adminDb.collection('users').doc(userId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as UserDocument;
}

export async function createUser(userId: string, data: Partial<UserDocument>): Promise<void> {
  await adminDb.collection('users').doc(userId).set({
    ...data,
    createdAt: new Date(),
  });
}

export async function updateUser(userId: string, data: Partial<UserDocument>): Promise<void> {
  await adminDb.collection('users').doc(userId).update(data);
}
