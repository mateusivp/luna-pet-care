import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
}

// Initialize Firebase Admin
const app = getApps().length === 0 
  ? initializeApp({
      credential: cert(serviceAccount as any),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    })
  : getApps()[0]

// Initialize Firebase Admin services
export const adminAuth = getAuth(app)
export const adminDb = getFirestore(app)
export const adminStorage = getStorage(app)

export default app

// Helper functions for custom claims
export async function setUserRole(uid: string, role: string, orgId: string) {
  try {
    await adminAuth.setCustomUserClaims(uid, { role, orgId })
    return { success: true }
  } catch (error) {
    console.error('Error setting user role:', error)
    return { success: false, error }
  }
}

export async function getUserClaims(uid: string) {
  try {
    const user = await adminAuth.getUser(uid)
    return { success: true, claims: user.customClaims }
  } catch (error) {
    console.error('Error getting user claims:', error)
    return { success: false, error }
  }
}

export async function verifyIdToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    return { success: true, token: decodedToken }
  } catch (error) {
    console.error('Error verifying ID token:', error)
    return { success: false, error }
  }
}