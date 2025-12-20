'use client'

import { useState, useEffect, useCallback } from 'react'
import { ethers, JsonRpcProvider } from 'ethers'
import Link from 'next/link'
import { formatDistanceToNowStrict } from 'date-fns'

interface AuctionInfo {
  auctionId: number
  itemName: string
  description: string
  startingPrice: number
  endTime: number
  bidCount: number
  isActive: boolean
}

const AUCTION_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000').trim()

const AUCTION_ABI = [
  'function getAuction(uint256 auctionId) external view returns (address creator, string memory itemName, string memory description, uint256 startingPrice, bool isActive, bool resultsRevealed, uint256 createdAt, uint256 endTime, uint256 bidCount)',
  'function auctionCounter() external view returns (uint256)',
]

export default function LiveAuctions() {
  const [auctions, setAuctions] = useState<AuctionInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load active auctions from contract
  const loadLiveAuctions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!ethers.isAddress(AUCTION_CONTRACT_ADDRESS) || AUCTION_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
        setLoading(false)
        return
      }
      
      const provider = new JsonRpcProvider('https://sepolia.drpc.org')
      const contract = new ethers.Contract(AUCTION_CONTRACT_ADDRESS, AUCTION_ABI, provider)

      // Get total auction count
      let totalAuctions = 0
      try {
        const auctionCounter = await contract.auctionCounter()
        totalAuctions = Number(auctionCounter)
      } catch {
        totalAuctions = 100
      }

      if (totalAuctions === 0) {
        setAuctions([])
        setLoading(false)
        return
      }

      // Check last 100 auctions for active ones
      const liveAuctions: AuctionInfo[] = []
      const currentTime = Math.floor(Date.now() / 1000)
      const startCheck = Math.max(0, totalAuctions - 100)
      let foundAuctions = 0
      let consecutiveErrors = 0
      
      for (let i = totalAuctions - 1; i >= startCheck && consecutiveErrors < 10; i--) {
        try {
          const [creator, itemName, description, startingPrice, isActive, resultsRevealed, createdAt, endTime, bidCount] = await contract.getAuction(i)
          consecutiveErrors = 0
          
          const endTimeNum = Number(endTime)
          const isNotEnded = endTimeNum > currentTime
          const hasValidCreator = creator && creator !== '0x0000000000000000000000000000000000000000'
          
          if (isActive && !resultsRevealed && isNotEnded && hasValidCreator) {
            liveAuctions.push({
              auctionId: i,
              itemName,
              description,
              startingPrice: Number(startingPrice),
              endTime: endTimeNum,
              bidCount: Number(bidCount),
              isActive: true,
            })
            foundAuctions++
            if (foundAuctions >= 20) break
          }
        } catch {
          consecutiveErrors++
          if (consecutiveErrors >= 10) break
        }
      }

      liveAuctions.sort((a, b) => b.auctionId - a.auctionId)
      setAuctions(liveAuctions)
    } catch (err: any) {
      setError(err.message || 'Failed to load auctions')
      setAuctions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const initialLoadTimeout = setTimeout(() => {
      loadLiveAuctions()
    }, 1000)

    const interval = setInterval(() => {
      loadLiveAuctions()
    }, 30000)
    
    return () => {
      clearTimeout(initialLoadTimeout)
      clearInterval(interval)
    }
  }, [loadLiveAuctions])

  const formatTimeRemaining = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000)
    const remaining = endTime - now

    if (remaining <= 0) return 'Ended'

    return formatDistanceToNowStrict(new Date(endTime * 1000), { addSuffix: true })
  }

  if (loading && auctions.length === 0) {
    return (
      <div className="glass-strong rounded-3xl p-12 text-center">
        <div className="animate-spin text-6xl mb-6 text-blue-500">⏳</div>
        <p className="text-gray-400 text-xl font-semibold">Loading auctions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-strong rounded-3xl p-12 text-center">
        <div className="text-6xl mb-6 text-blue-500">⚠️</div>
        <p className="text-blue-400 text-xl mb-4 font-bold">Error loading auctions</p>
        <p className="text-gray-500 mb-6 text-sm">{error}</p>
        <button
          onClick={loadLiveAuctions}
          className="inline-block px-8 py-4 rounded-xl bg-blue-600 text-white font-bold hover:opacity-90 transition shadow-blue-500/50 shadow-lg"
        >
          Retry
        </button>
      </div>
    )
  }

  if (auctions.length === 0) {
    return (
      <div className="glass-strong rounded-3xl p-12 text-center">
        <div className="text-6xl mb-6 text-blue-500">🔨</div>
        <p className="text-gray-300 text-2xl mb-4 font-bold">No active auctions</p>
        <p className="text-gray-500 mb-6">
          Be the first to create an auction!
        </p>
        <Link
          href="/auctions"
          className="inline-block px-8 py-4 rounded-xl bg-blue-600 text-white font-bold hover:opacity-90 transition shadow-blue-500/50 shadow-lg"
        >
          Create Auction →
        </Link>
      </div>
    )
  }

  return (
    <div className="glass-strong rounded-3xl p-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl font-black text-white text-blue-500">
          🔴 Live Auctions
        </h2>
        <button
          onClick={loadLiveAuctions}
          disabled={loading}
          className="px-4 py-2 glass rounded-xl text-white font-bold hover:bg-white/10 transition disabled:opacity-50 text-sm"
          title="Refresh auctions"
        >
          {loading ? '⏳' : '🔄'}
        </button>
      </div>
      <div className="space-y-4">
        {auctions.map((auction) => (
          <Link
            key={auction.auctionId}
            href={`/auctions?auction=${auction.auctionId}`}
            className="block glass rounded-2xl p-6 hover:bg-white/5 transition-all border-2 border-white/10 hover:border-blue-600/50"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-black text-white flex-1 pr-4">
                {auction.itemName}
              </h3>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg font-bold text-sm border-2 border-green-500/50">
                  🔴 Live
                </span>
                <span className="px-3 py-1 glass rounded-lg font-bold text-sm text-gray-300">
                  ⏰ {formatTimeRemaining(auction.endTime)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>💰 {ethers.formatEther(auction.startingPrice.toString())} ETH starting</span>
                <span>🔨 {auction.bidCount} bids</span>
              </div>
              <span className="text-blue-400 font-bold text-sm hover:text-blue-300 transition">
                Bid Now →
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/auctions"
          className="inline-block px-8 py-4 rounded-xl bg-blue-600 text-white font-bold hover:opacity-90 transition shadow-blue-500/50 shadow-lg"
        >
          View All Auctions →
        </Link>
      </div>
    </div>
  )
}

