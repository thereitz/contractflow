import type { Metadata } from 'next'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ContractFlow',
  description: 'Система согласования договоров',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}