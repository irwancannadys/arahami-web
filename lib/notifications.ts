import { auth } from './firebase/config'

export async function sendNotification(
  token: string,
  title: string,
  body:  string,
  data?: Record<string, string>,
): Promise<void> {
  try {
    const idToken = await auth.currentUser?.getIdToken()
    await fetch('/api/notifications/send', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ token, title, body, data }),
    })
  } catch (e) {
    console.warn('[notif] sendNotification failed:', e)
  }
}
