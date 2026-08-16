export async function sendNotification(
  token: string,
  title: string,
  body:  string,
  data?: Record<string, string>,
): Promise<void> {
  try {
    await fetch('/api/notifications/send', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': 'arahami-secret-2026',
      },
      body: JSON.stringify({ token, title, body, data }),
    })
  } catch (e) {
    console.warn('[notif] sendNotification failed:', e)
  }
}
