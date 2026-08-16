import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0]

  return initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export const adminApp       = getAdminApp()
export const adminMessaging = getMessaging(adminApp)
