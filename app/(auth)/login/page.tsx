'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithPopup, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { auth, provider } from '@/lib/firebase/config'

export default function LoginPage() {
  const router  = useRouter()
  const [error, setError] = useState<string | null>(null)

  // Kalau user sudah login (mis. dari session sebelumnya) → langsung redirect
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.push('/beranda')
    })
    return unsub
  }, [router])

  async function handleGoogleLogin() {
    setError(null)
    try {
      await setPersistence(auth, browserLocalPersistence)
      await signInWithPopup(auth, provider)
      router.push('/beranda')
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') return
      setError(err?.code ?? 'Gagal masuk. Coba lagi.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="bg-white border border-[#DBDBDB] rounded-2xl p-10 w-full max-w-sm flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">🎒</span>
          <h1 className="text-2xl font-bold tracking-tight">Arahami</h1>
          <p className="text-sm text-[#737373] text-center">
            Dashboard orang tua — pantau belajar anak kamu
          </p>
        </div>

        <div className="w-full h-px bg-[#DBDBDB]" />

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 border border-[#DBDBDB] rounded-lg px-4 py-3 text-sm font-semibold hover:bg-[#FAFAFA] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Masuk dengan Google
        </button>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <p className="text-xs text-[#737373] text-center">
          Khusus untuk orang tua. Anak masuk lewat kode 4 digit di app.
        </p>
      </div>
    </div>
  )
}
