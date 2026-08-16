import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, getDocs, collection } from 'firebase/firestore'
import { app, db } from './config'

export async function registerFcmToken(uid: string): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
    })

    if (!token) return null

    // Simpan ke user doc (parent)
    await setDoc(doc(db, 'users', uid), { fcmToken: token }, { merge: true })

    // Copy ke semua child doc yang belum punya token — untuk testing
    // (Android nanti akan overwrite dengan token-nya sendiri)
    const childrenSnap = await getDocs(collection(db, 'users', uid, 'children'))
    for (const child of childrenSnap.docs) {
      if (!child.data().fcmToken) {
        await setDoc(child.ref, { fcmToken: token }, { merge: true })
      }
    }

    return token
  } catch (e) {
    console.warn('[fcm] registerFcmToken failed:', e)
    return null
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  if (typeof window === 'undefined') return () => {}
  const messaging = getMessaging(app)
  return onMessage(messaging, callback)
}
