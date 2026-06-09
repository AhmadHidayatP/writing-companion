import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Writing Companion — AI untuk Penulis Indonesia',
  description: 'Asisten menulis bertenaga AI yang memahami konteks naskahmu. Dibangun untuk Agents League Hackathon 2026.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-ink-50 text-ink-900 antialiased">
        {children}
      </body>
    </html>
  )
}
