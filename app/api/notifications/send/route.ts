import { NextResponse } from 'next/server'
import { adminMessaging } from '@/lib/firebase/admin'
import { checkAuth } from '@/lib/gemini'

export interface NotifPayload {
  token: string
  title: string
  body:  string
  data?: Record<string, string>
}

export async function POST(req: Request) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token, title, body, data } = await req.json() as NotifPayload

  if (!token || !title || !body) {
    return NextResponse.json({ error: 'token, title, body wajib diisi' }, { status: 400 })
  }

  try {
    const messageId = await adminMessaging.send({
      token,
      notification: { title, body },
      data,
      webpush: {
        notification: { title, body, requireInteraction: false },
        fcmOptions:   { link: '/' },
      },
    })

    return NextResponse.json({ success: true, messageId })
  } catch (e: any) {
    console.error('[fcm] send error:', e?.message)
    // Token tidak valid / expired — anggap sukses biar tidak crash flow
    if (e?.code === 'messaging/registration-token-not-registered') {
      return NextResponse.json({ success: false, reason: 'token-expired' })
    }
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
