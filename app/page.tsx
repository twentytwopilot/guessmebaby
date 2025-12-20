'use client'

import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import LiveAuctions from '@/components/LiveAuctions'

export default function Home() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="text-center mb-16 animate-slide-in relative z-10">
        <div className="mb-8">
          <h1 className="text-8xl md:text-[12rem] font-black mb-6 gradient-text leading-none">
            SECRET
          </h1>
          <h1 className="text-8xl md:text-[12rem] font-black mb-6 gradient-text leading-none">
            AUCTION
          </h1>
        </div>
        
        <p className="text-2xl md:text-4xl text-gray-300 mb-6 font-light">
          Encrypted bidding on <span className="gradient-text font-bold">blockchain</span>
        </p>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
          Create auctions. Bid encrypted. Stay private. Your bid is secret until auction ends.
        </p>
      </div>

      {isConnected ? (
        <Link
          href="/auctions"
          className="relative z-10 px-16 py-6 rounded-2xl gradient-bg text-white font-bold text-2xl glow-hover transition-all duration-300 animate-slide-in group"
        >
          <span className="relative z-10">Start Bidding →</span>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
        </Link>
      ) : (
        <div className="text-center animate-slide-in relative z-10">
          <p className="text-gray-300 mb-6 text-xl">
            Connect your wallet to begin
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      )}

      <div className="mt-24 max-w-6xl w-full relative z-10 space-y-12">
        <LiveAuctions />

        <div className="glass-strong rounded-3xl p-12">
          <h2 className="text-4xl font-black text-white mb-8 text-center gradient-text">
            How it works?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🔐</div>
              <h3 className="font-bold text-white mb-3 text-xl">Encrypt</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your bid is encrypted using Zama FHE before hitting the blockchain
              </p>
            </div>
            <div className="text-center group">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">👁️</div>
              <h3 className="font-bold text-white mb-3 text-xl">Private</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Nobody sees your bid. Complete privacy until auction ends
              </p>
            </div>
            <div className="text-center group">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🏆</div>
              <h3 className="font-bold text-white mb-3 text-xl">Reveal</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Winner revealed after auction ends. Highest encrypted bid wins
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
