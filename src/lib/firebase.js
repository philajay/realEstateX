import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
]

export const missingConfigVars = REQUIRED_VARS.filter((key) => !import.meta.env[key])
export const isFirebaseConfigured = missingConfigVars.length === 0
export const projectId = config.projectId

export const ROLES = ['buyer', 'seller']
export const DEFAULT_ROLE = 'buyer'
export const USERS_COLLECTION = 'users'

let auth = null
let db = null
let fs = null

if (isFirebaseConfigured) {
  const app = getApps().length ? getApp() : initializeApp(config)
  auth = getAuth(app)
  db = getFirestore(app)
  fs = getStorage(app)
}

export function getFirebaseAuth() {
  return auth
}

export function getFirebaseDb() {
  return db
}

export function getFirebaseStorage() {
  return fs
}

function userRef(uid) {
  return doc(db, USERS_COLLECTION, uid)
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  const credential = await signInWithPopup(auth, provider)
  return credential.user
}

/**
 * Reads users/{uid}. Creates it with the given role when it does not exist yet,
 * otherwise leaves the stored role and createdAt alone and only refreshes
 * lastLoginAt (BR-004).
 */
export async function loadOrCreateUser(user, role) {
  const ref = userRef(user.uid)
  const snapshot = await getDoc(ref)

  if (!snapshot.exists()) {
    const profile = {
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      photoURL: user.photoURL ?? '',
      role: ROLES.includes(role) ? role : DEFAULT_ROLE,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    }
    await setDoc(ref, profile)
    return profile
  }

  const stored = snapshot.data()
  await updateDoc(ref, { lastLoginAt: serverTimestamp() })
  return stored
}

export async function signOutUser() {
  await firebaseSignOut(auth)
}

export function observeAuth(callback) {
  if (!auth) return () => {}
  return onAuthStateChanged(auth, callback)
}

export function friendlyAuthError(error) {
  const code = error?.code ?? ''
  switch (code) {
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in popup. Allow popups for this site and try again.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null
    case 'auth/account-exists-with-different-credential':
      return 'This Google account is already registered with a different sign-in method.'
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled on this Firebase project. Ask an administrator to enable it.'
    case 'auth/network-request-failed':
      return 'Network error while contacting Google. Check your connection and try again.'
    case 'auth/invalid-api-key':
    case 'auth/operation-not-supported-in-this-environment':
      return 'Firebase is not configured correctly for this app.'
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'Firestore rejected the request. Check the security rules on this project.'
    case 'unavailable':
      return 'Firestore is unavailable right now. Please try again.'
    default:
      return error?.message || 'Something went wrong while signing in.'
  }
}
