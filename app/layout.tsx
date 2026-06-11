import './globals.css'

export const metadata = {
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