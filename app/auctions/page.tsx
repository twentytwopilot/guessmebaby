'use client'

import { useAccount } from 'wagmi'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ethers } from 'ethers'
import { getProvider, getSigner } from '@/lib/provider'
import AuctionItem from '@/components/AuctionItem'
import Link from 'next/link'

const AUCTION_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000').trim()

const AUCTION_ABI = [
  'function createAuction(string memory itemName, string memory description, uint256 startingPrice, uint256 duration) external returns (uint256)',
  'function getUserAuctions(address user) external view returns (uint256[])',
  'function getUserBids(address user) external view returns (uint256[])',
  'function getAuction(uint256 auctionId) external view returns (address creator, string memory itemName, string memory description, uint256 startingPrice, bool isActive, bool resultsRevealed, uint256 createdAt, uint256 endTime, uint256 bidCount)',
  'function auctionCounter() external view returns (uint256)',
  'event AuctionCreated(uint256 indexed auctionId, address indexed creator, string itemName, uint256 endTime)',
]

function AuctionsPageContent() {
  const { address, isConnected } = useAccount()
  const searchParams = useSearchParams()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [auctions, setAuctions] = useState<number[]>([])
  const [selectedAuction, setSelectedAuction] = useState<number | null>(null)

  const [itemName, setItemName] = useState('')
  const [description, setDescription] = useState('')
  const [startingPrice, setStartingPrice] = useState('')
  const [duration, setDuration] = useState(3600)

  useEffect(() => {
    const auctionParam = searchParams.get('auction')
    if (auctionParam) {
      const auctionId = parseInt(auctionParam)
      if (!isNaN(auctionId) && auctionId >= 0) {
        setSelectedAuction(auctionId)
      }
    }
  }, [searchParams])

  useEffect(() => {
    if (isConnected && address) {
      loadAllAuctions()
    } else {
      setAuctions([])
    }
  }, [isConnected, address])

  // Load all auctions user created or bid in
  const loadAllAuctions = async () => {
    if (!address || !isConnected) return

    try {
      const provider = getProvider()
      const contract = new ethers.Contract(AUCTION_CONTRACT_ADDRESS, AUCTION_ABI, provider)
      
      // Get auctions user created
      const userAuctions = await contract.getUserAuctions(address)
      const createdAuctions = userAuctions.map((id: any) => Number(id))
      
      // Get auctions user bid in
      const userBids = await contract.getUserBids(address)
      const bidAuctions = userBids.map((id: any) => Number(id))
      
      const allAuctions = [...new Set([...createdAuctions, ...bidAuctions])]
      
      // Also load recent auctions
      try {
        const auctionCounter = await contract.auctionCounter()
        const totalAuctions = Number(auctionCounter)
        const recentAuctions: number[] = []
        
        const startId = Math.max(0, totalAuctions - 20)
        for (let i = startId; i < totalAuctions; i++) {
          try {
            const auction = await contract.getAuction(i)
            if (auction && auction.creator && auction.creator !== '0x0000000000000000000000000000000000000000') {
              recentAuctions.push(i)
            }
          } catch {
            continue
          }
        }
        
        const combinedAuctions = [...new Set([...allAuctions, ...recentAuctions])]
        combinedAuctions.sort((a, b) => b - a)
        setAuctions(combinedAuctions)
      } catch {
        allAuctions.sort((a, b) => b - a)
        setAuctions(allAuctions)
      }
    } catch (err: any) {
      console.error('Error loading auctions:', err)
    }
  }

  // Create new auction
  const createAuction = async () => {
    if (!address || !isConnected) {
      setError('Please connect your wallet')
      return
    }

    if (!itemName.trim()) {
      setError('Please enter an item name')
      return
    }

    if (!startingPrice || parseFloat(startingPrice) <= 0) {
      setError('Please enter a valid starting price')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const signer = await getSigner()
      const contract = new ethers.Contract(AUCTION_CONTRACT_ADDRESS, AUCTION_ABI, signer)

      const startingPriceWei = ethers.parseEther(startingPrice)

      const tx = await contract.createAuction(itemName, description, startingPriceWei, duration)
      const receipt = await tx.wait()

      // Find auction ID from event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log)
          return parsed?.name === 'AuctionCreated'
        } catch {
          return false
        }
      })

      if (event) {
        const parsed = contract.interface.parseLog(event)
        const auctionId = Number(parsed?.args.auctionId)
        await loadAllAuctions()
        setSelectedAuction(auctionId)
        setShowCreateForm(false)
        setItemName('')
        setDescription('')
        setStartingPrice('')
        setDuration(3600)
      }
    } catch (err: any) {
      let errorMessage = 'Failed to create auction'
      if (err.message) {
        errorMessage = err.message
      } else if (err.reason) {
        errorMessage = err.reason
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (selectedAuction !== null) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <button
          onClick={() => setSelectedAuction(null)}
          className="mb-6 px-6 py-3 glass rounded-xl text-white font-bold hover:bg-white/10 transition"
        >
          ← Back to Auctions
        </button>
        <AuctionItem auctionId={selectedAuction} />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-5xl font-black gradient-text">Auctions</h1>
        {isConnected && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-8 py-4 rounded-2xl gradient-bg text-white font-bold hover:opacity-90 transition glow-hover"
          >
            {showCreateForm ? 'Cancel' : '+ Create Auction'}
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="mb-8 glass-strong rounded-3xl p-8">
          <h2 className="text-3xl font-black text-white mb-6">Create New Auction</h2>
          {error && (
            <div className="mb-6 glass rounded-2xl p-4 border-2 border-red-600/50 bg-red-600/10">
              <p className="text-red-400 font-bold">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Item Name"
              className="w-full p-4 rounded-xl glass text-white font-bold placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              rows={4}
              className="w-full p-4 rounded-xl glass text-white font-bold placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              placeholder="Starting Price (ETH)"
              step="0.001"
              min="0"
              className="w-full p-4 rounded-xl glass text-white font-bold placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 3600)}
              placeholder="Duration (seconds)"
              min="1"
              className="w-full p-4 rounded-xl glass text-white font-bold placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={createAuction}
              disabled={loading}
              className="w-full px-8 py-4 rounded-2xl gradient-bg text-white font-black text-xl hover:opacity-90 transition disabled:opacity-50 glow-hover"
            >
              {loading ? 'Creating...' : 'Create Auction'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {auctions.length === 0 ? (
          <div className="glass-strong rounded-3xl p-12 text-center">
            <div className="text-6xl mb-6">🔨</div>
            <p className="text-gray-300 text-xl mb-4">No auctions found</p>
            {!isConnected && (
              <p className="text-gray-500">Connect your wallet to see your auctions</p>
            )}
          </div>
        ) : (
          auctions.map((auctionId) => (
            <div
              key={auctionId}
              onClick={() => setSelectedAuction(auctionId)}
              className="glass-strong rounded-2xl p-6 cursor-pointer hover:bg-white/5 transition border-2 border-white/10 hover:border-blue-600/50"
            >
              <p className="text-white font-bold text-lg">Auction #{auctionId}</p>
              <p className="text-gray-400 text-sm mt-2">Click to view details</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function AuctionsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-spin text-6xl mb-6">⏳</div>
        <p className="text-gray-400">Loading...</p>
      </div>
    }>
      <AuctionsPageContent />
    </Suspense>
  )
}

