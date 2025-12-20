'use client'

import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen py-12 px-4 relative">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-16 animate-slide-in">
          <h1 className="text-6xl md:text-8xl font-black mb-6 gradient-text">
            ABOUT
          </h1>
          <p className="text-xl text-gray-300">
            Learn more about Secret Auction
          </p>
        </div>

        <div className="space-y-10">
          <div className="glass-strong rounded-3xl p-12 animate-slide-in neon-border">
            <h2 className="text-4xl font-black text-white mb-6 gradient-text">What is this?</h2>
            <p className="text-gray-300 text-xl leading-relaxed">
              Secret Auction is a decentralized auction platform built on Ethereum using Zama's Fully Homomorphic Encryption (FHE) technology. 
              Unlike traditional auctions, your bids are encrypted and stored on the blockchain, ensuring complete privacy during the bidding process.
            </p>
          </div>

          <div className="glass-strong rounded-3xl p-12 animate-slide-in">
            <h2 className="text-4xl font-black text-white mb-8 gradient-text">How it works?</h2>
            <div className="space-y-6 text-gray-300">
              <div className="glass rounded-2xl p-6">
                <h3 className="text-2xl font-black text-white mb-3">1. Create an Auction</h3>
                <p className="text-lg">Create an auction with item name, description, and starting price. Set the duration for bidding.</p>
              </div>
              <div className="glass rounded-2xl p-6">
                <h3 className="text-2xl font-black text-white mb-3">2. Bid Encrypted</h3>
                <p className="text-lg">Bidders submit their bids encrypted using Zama's FHE technology. No one can see individual bids.</p>
              </div>
              <div className="glass rounded-2xl p-6">
                <h3 className="text-2xl font-black text-white mb-3">3. Results Revealed</h3>
                <p className="text-lg">After the auction ends, the creator can reveal results. Highest encrypted bid wins.</p>
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-12 animate-slide-in">
            <h2 className="text-4xl font-black text-white mb-8 gradient-text">Technology</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="text-2xl font-black text-white mb-3">Zama FHEVM</h3>
                <p className="text-gray-300">
                  Fully Homomorphic Encryption allows computations on encrypted data without decrypting it first. 
                  This means your bids stay private even on a public blockchain.
                </p>
              </div>
              <div className="glass rounded-2xl p-6">
                <h3 className="text-2xl font-black text-white mb-3">Ethereum Sepolia</h3>
                <p className="text-gray-300">
                  All auctions are stored as smart contracts on the Sepolia testnet. 
                  This ensures transparency and immutability of auction results.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-12 animate-slide-in">
            <h2 className="text-4xl font-black text-white mb-8 gradient-text">Smart Contract</h2>
            <div className="glass rounded-2xl p-8">
              <h3 className="text-2xl font-black text-white mb-4">SecretAuction</h3>
              <p className="text-gray-300 text-lg mb-4">Smart contract for creating auctions and placing encrypted bids.</p>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  Address: <code className="bg-black/50 px-3 py-1 rounded-lg font-mono text-blue-400">Deploy to get address</code>
                </p>
                <p className="text-sm text-gray-400">
                  Network: Sepolia Testnet
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/auctions"
              className="inline-block px-12 py-5 rounded-2xl gradient-bg text-white font-black text-xl hover:opacity-90 transition glow-hover"
            >
              Start Bidding →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
