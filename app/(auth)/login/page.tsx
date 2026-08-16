'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth'
import Image from 'next/image'
import { auth, provider } from '@/lib/firebase/config'
import { useNoBackNavigation } from '@/lib/hooks/useNoBackNavigation'

const IGNORED_ERRORS = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request']

export default function LoginPage() {
  const router                  = useRouter()
  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState<string | null>(null)

  useNoBackNavigation()

  useEffect(() => {
    return onAuthStateChanged(auth, user => {
      if (user) router.replace('/beranda')
    })
  }, [router])

  async function handleLogin() {
    setError(null)
    setLoading(true)
    try {
      await signInWithPopup(auth, provider)
      router.replace('/beranda')
    } catch (e: any) {
      if (!IGNORED_ERRORS.includes(e?.code)) {
        setError('Gagal masuk. Coba lagi.')
        console.error('[login]', e?.code, e?.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center gap-10 px-14 py-12"
        style={{ background: 'linear-gradient(135deg, #0095F6 0%, #00C6A2 100%)' }}>

        <Image
          src="/logo-text.png"
          alt="Arahami"
          width={320}
          height={88}
          className="brightness-0 invert -ml-2"
        />

        <div className="space-y-4">
          <h1 className="text-[36px] font-extrabold text-white leading-tight">
            Pantau belajar<br />anak kamu,<br />di mana saja.
          </h1>
          <p className="text-white/75 text-[15px] leading-relaxed max-w-xs">
            Dashboard orang tua untuk memantau progress belajar, menyetujui reward, dan berkomunikasi dengan anak.
          </p>
        </div>

        <p className="text-white/50 text-[13px]">Belajar seru, ortu tenang.</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] p-8">
        <div className="w-full max-w-sm space-y-8">

          {/* Logo + title */}
          <div className="flex flex-col items-center gap-4">
            <Image src="/logo-icon.png" alt="Arahami" width={96} height={96} className="rounded-3xl shadow-lg" />
            <div className="text-center">
              <h2 className="text-[24px] font-extrabold text-[#0A0A0A]">Masuk ke Arahami</h2>
              <p className="text-[14px] text-[#737373] mt-1">Dashboard orang tua</p>
            </div>
          </div>

          {/* Login card */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E8EAF0] p-6 space-y-4">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-[#DBDBDB] rounded-xl px-4 py-3 text-[14px] font-semibold text-[#374151] hover:bg-[#F9FAFB] hover:border-[#0095F6] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-[#DBDBDB] border-t-[#0095F6] rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {loading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}
            </button>

            {error && (
              <p className="text-[13px] text-red-500 text-center">{error}</p>
            )}
          </div>

          <p className="text-[12px] text-[#A8A8A8] text-center">
            Khusus untuk orang tua. Anak masuk lewat kode 4 digit di app Android.
          </p>

        </div>
      </div>

    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
