import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, initializeAuth, browserLocalPersistence, browserPopupRedirectResolver, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// initializeAuth hanya sekali, getAuth untuk re-evaluasi berikutnya (HMR)
// Pakai browserLocalPersistence (localStorage) bukan IndexedDB — bypass bug
// "Database is closing/hidden" di Firebase SDK 10+ / 12+
const isFirst = getApps().length === 0
const app     = isFirst ? initializeApp(firebaseConfig) : getApp()

// initializeAuth + browser persistence hanya di client — server pakai getAuth biasa
const auth = isFirst && typeof window !== 'undefined'
  ? initializeAuth(app, {
      persistence:           browserLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    })
  : getAuth(app)
const db       = getFirestore(app)
const provider = new GoogleAuthProvider()

export { app, auth, db, provider }
