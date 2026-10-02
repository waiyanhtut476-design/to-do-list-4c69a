import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import localAppletConfig from '../../firebase-applet-config.json';

// User's custom Firebase Configuration
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCBtHUj5tmOdMJGufVAb5nYEIFwBWxwdDg",
  authDomain: "to-do-list-4c69a.firebaseapp.com",
  projectId: "to-do-list-4c69a",
  storageBucket: "to-do-list-4c69a.firebasestorage.app",
  messagingSenderId: "484067821234",
  appId: "1:484067821234:web:22f4700a7466364f5e6bab",
  firestoreDatabaseId: "(default)"
};

// Auto-detect environment to resolve domain auth restrictions
const isPreviewEnv = typeof window !== 'undefined' && (
  window.location.hostname.includes('run.app') || 
  window.location.hostname.includes('aistudio') ||
  window.location.hostname.includes('localhost')
);

// If we are in the AI Studio preview environment, we MUST prioritize the platform's automatically provisioned project (localAppletConfig)
// because its Authorized Domains are pre-configured to allow Google Auth.
// Otherwise, use the user's custom production project.
const activeConfig = (isPreviewEnv && localAppletConfig?.apiKey)
  ? {
      apiKey: localAppletConfig.apiKey,
      authDomain: localAppletConfig.authDomain,
      projectId: localAppletConfig.projectId,
      storageBucket: localAppletConfig.storageBucket,
      messagingSenderId: localAppletConfig.messagingSenderId,
      appId: localAppletConfig.appId,
      firestoreDatabaseId: localAppletConfig.firestoreDatabaseId || '(default)'
    }
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
      appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
      firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId || '(default)'
    };

const app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();
export const db = getFirestore(app, activeConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: client is offline or initializing.');
    }
    return false;
  }
}

export { signInWithPopup, signInAnonymously, signOut, onAuthStateChanged };
export type { User };
