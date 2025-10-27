import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function resolveCredential() {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error('Missing Firebase project id for admin SDK.');
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    return {
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    } as const;
  }

  return {
    credential: applicationDefault(),
    projectId,
  } as const;
}

const { credential, projectId } = resolveCredential();

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential,
      projectId,
    });

export const adminDb = getFirestore(app);
