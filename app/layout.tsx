import type { Metadata } from 'next'
import { Cinzel, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import LanguageSelector from '@/components/language-selector'
import VisitorTracker from '@/components/visitor-tracker'
import GlobalMusicPlayer from '@/components/global-music-player'
import './globals.css'

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: 'Aliança FODA - Guilda de Elite',
  description: 'Soldados… Não lutamos apenas por pontos ou território. Lutamos para que nosso nome ecoe acima de todos neste servidor.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${cinzel.variable} ${inter.variable}`}>
      <body className="font-sans antialiased bg-background">
        <LanguageSelector />
        <VisitorTracker />
        <GlobalMusicPlayer />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <SpeedInsights />
      </body>
    </html>
  )
}
