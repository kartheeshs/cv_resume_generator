import { getApp, getApps, initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const appName = process.env.NEXT_PUBLIC_FIREBASE_APP_NAME || 'cv-resume-generator';

const existingApp = getApps().find((candidate) => candidate.name === appName);

const app = existingApp ? getApp(appName) : initializeApp(firebaseConfig, appName);

export const auth = getAuth(app);
auth.useDeviceLanguage();

if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed to enable persistent auth session', error);
    }
  });
}

export const db = getFirestore(app);

export default app;
