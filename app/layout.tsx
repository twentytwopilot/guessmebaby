import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import GameNavigation from '@/components/GameNavigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Secret Auction | Encrypted Bidding with Zama FHEVM',
  description: 'Create auctions and place encrypted bids with complete privacy. Your bids are secret until auction ends.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof global === 'undefined') {
                window.global = globalThis;
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <Providers>
          <GameNavigation />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
