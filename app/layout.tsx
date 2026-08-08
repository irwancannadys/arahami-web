import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/layout/AuthProvider'

const nunito = Nunito({
  subsets:  ['latin'],
  variable: '--font-nunito',
  weight:   ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title:       'Arahami — Dashboard Orang Tua',
  description: 'Pantau dan dukung belajar anak kamu',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className={`${nunito.variable} font-[family-name:var(--font-nunito)] min-h-full bg-[#FAFAFA] text-[#0A0A0A] antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
