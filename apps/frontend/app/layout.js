import { Inter, Kanit, Fredoka } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
})

const kanit = Kanit({
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-kanit',
  display: 'swap',
})

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
})

export const metadata = {
  title: 'Scoreboard',
  description: 'Realtime school event scoreboard',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${inter.variable} ${kanit.variable} ${fredoka.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
