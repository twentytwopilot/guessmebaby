'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { ethers, JsonRpcProvider } from 'ethers'
import { getSigner } from '@/lib/provider'
import { formatDistanceToNowStrict } from 'date-fns'

interface Auction {
  auctionId: number
  creator: string
  itemName: string
  description: string
  startingPrice: number
  isActive: boolean
  resultsRevealed: boolean
  createdAt: number
  endTime: number
  bidCount: number
  hasBid: boolean
  winner?: string
  winningBid?: number
}

const AUCTION_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000').trim()

const AUCTION_ABI = [
  'function createAuction(string memory itemName, string memory description, uint256 startingPrice, uint256 duration) external returns (uint256)',
  'function placeBid(uint256 auctionId, bytes32 encryptedBid, bytes calldata attestation) external',
  'function revealResults(uint256 auctionId, address winner, uint256 winningBid) external',
  'function endAuction(uint256 auctionId) external',
  'function getAuction(uint256 auctionId) external view returns (address creator, string memory itemName, string memory description, uint256 startingPrice, bool isActive, bool resultsRevealed, uint256 createdAt, uint256 endTime, uint256 bidCount)',
  'function getResults(uint256 auctionId) external view returns (address winner, uint256 winningBid, bool revealed)',
  'function hasBid(uint256 auctionId, address bidder) external view returns (bool)',
  'function getUserAuctions(address user) external view returns (uint256[])',
  'function getUserBids(address user) external view returns (uint256[])',
  'event AuctionCreated(uint256 indexed auctionId, address indexed creator, string itemName, uint256 endTime)',
  'event BidPlaced(uint256 indexed auctionId, address indexed bidder)',
  'event ResultsRevealed(uint256 indexed auctionId, address winner, uint256 winningBid)',
]

export default function AuctionItem({ auctionId }: { auctionId: number }) {
  const { address, isConnected } = useAccount()
  const [auction, setAuction] = useState<Auction | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [relayerInstance, setRelayerInstance] = useState<any>(null)

  useEffect(() => {
    loadAuction()
    if (isConnected && address) {
      initRelayer()
    }
  }, [auctionId, isConnected, address])

  // Setup relayer for encryption
  const initRelayer = async () => {
    if (relayerInstance) return
    
    try {
      if (typeof window === 'undefined') {
        throw new Error('Browser only')
      }

      if (typeof global === 'undefined') {
        (window as any).global = globalThis
      }

      const relayerModule = await import('@zama-fhe/relayer-sdk/web')
      const sdkInitialized = await relayerModule.initSDK()
      if (!sdkInitialized) {
        throw new Error('SDK init failed')
      }
      
      const instance = await relayerModule.createInstance(relayerModule.SepoliaConfig)
      setRelayerInstance(instance)
    } catch {
      // will show error when user tries to bid
    }
  }

  // Load auction data from contract
  const loadAuction = async () => {
    try {
      const { JsonRpcProvider } = await import('ethers')
      const provider = new JsonRpcProvider('https://sepolia.drpc.org')
      const contract = new ethers.Contract(AUCTION_CONTRACT_ADDRESS, AUCTION_ABI, provider)

      const [creator, itemName, description, startingPrice, isActive, resultsRevealed, createdAt, endTime, bidCount] = await contract.getAuction(auctionId)

      let hasBid = false
      if (isConnected && address) {
        try {
          hasBid = await contract.hasBid(auctionId, address)
        } catch {
          // skip if check fails
        }
      }

      let winner: string | undefined
      let winningBid: number | undefined
      if (resultsRevealed) {
        try {
          const [winnerAddr, winningBidAmount] = await contract.getResults(auctionId)
          winner = winnerAddr
          winningBid = Number(winningBidAmount)
        } catch {
          // skip if results not available
        }
      }

      setAuction({
        auctionId: Number(auctionId),
        creator,
        itemName,
        description,
        startingPrice: Number(startingPrice),
        isActive,
        resultsRevealed,
        createdAt: Number(createdAt),
        endTime: Number(endTime),
        bidCount: Number(bidCount),
        hasBid,
        winner,
        winningBid,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load auction')
    }
  }

  const placeBid = async () => {
    if (!address || !isConnected || !auction || !bidAmount || !relayerInstance) {
      setError('Please enter a bid amount and ensure relayer is initialized')
      return
    }

    if (auction.hasBid) {
      setError('You have already placed a bid')
      return
    }

    const bidValue = parseFloat(bidAmount)
    if (isNaN(bidValue) || bidValue <= 0) {
      setError('Please enter a valid bid amount')
      return
    }

    const bidInWei = ethers.parseEther(bidAmount)
    const startingPriceInWei = BigInt(auction.startingPrice)
    
    if (bidInWei < startingPriceInWei) {
      setError(`Bid must be at least ${ethers.formatEther(auction.startingPrice.toString())} ETH`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' })
          if (chainId !== '0xaa36a7') {
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xaa36a7' }],
              })
              await new Promise(resolve => setTimeout(resolve, 1000))
            } catch {
              // ignore
            }
          }
        } catch {
          // ignore
        }
      }

      const signer = await getSigner()
      const contract = new ethers.Contract(AUCTION_CONTRACT_ADDRESS, AUCTION_ABI, signer)

      if (!relayerInstance) {
        throw new Error('Relayer not initialized')
      }

      const bidInWei = ethers.parseEther(bidAmount)
      
      // Scale bid to fit in uint8 (0-255) for encryption
      const bidValueUint8 = Math.min(255, Math.floor(Number(bidInWei) / 1e15))
      
      // Encrypt bid using relayer
      let encryptedInput
      try {
        const inputBuilder = relayerInstance.createEncryptedInput(AUCTION_CONTRACT_ADDRESS, address)
        inputBuilder.add8(bidValueUint8)
        encryptedInput = await Promise.race([
          inputBuilder.encrypt(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Encryption timeout')), 30000)
          )
        ]) as any
      } catch (encryptError: any) {
        let errorMessage = encryptError?.message || 'Encryption failed'
        if (errorMessage.includes('JSON') || errorMessage.includes('Bad JSON')) {
          errorMessage = 'Relayer connection issue. Please try again.'
        }
        throw new Error(errorMessage)
      }
      
      if (!encryptedInput?.handles || encryptedInput.handles.length === 0) {
        throw new Error('Encryption failed: no handles returned')
      }
      
      if (!encryptedInput.inputProof) {
        throw new Error('Encryption failed: no proof returned')
      }

      // Send encrypted bid to contract
      const encryptedHandle = encryptedInput.handles[0]
      const attestation = encryptedInput.inputProof

      const tx = await contract.placeBid(auctionId, encryptedHandle, attestation)
      await tx.wait()
      await loadAuction()
    } catch (err: any) {
      let errorMessage = 'Failed to place bid'
      
      if (err.message) {
        errorMessage = err.message
      } else if (err.reason) {
        errorMessage = err.reason
      }
      
      if (errorMessage.includes('JSON') || errorMessage.includes('Bad JSON')) {
        errorMessage = 'Relayer connection error. Please check your internet connection and ensure you are on Sepolia testnet.'
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and ensure you are on Sepolia testnet.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!auction) {
    return (
      <div className="glass-strong rounded-3xl p-12 text-center">
        <div className="animate-spin text-6xl mb-6">⏳</div>
        <p className="text-gray-400 text-xl font-semibold">Loading auction...</p>
      </div>
    )
  }

  const isExpired = Date.now() / 1000 > auction.endTime
  const isCreator = auction.creator.toLowerCase() === address?.toLowerCase()

  return (
    <div className="glass-strong rounded-3xl p-10 animate-slide-in neon-border">
      {error && (
        <div className="mb-8 glass rounded-2xl p-6 border-2 border-red-600/50 bg-red-600/10">
          <p className="text-red-400 font-bold">{error}</p>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-4xl font-black text-white mb-6 gradient-text">{auction.itemName}</h2>
        <p className="text-gray-300 text-lg mb-4">{auction.description}</p>
        <div className="flex items-center gap-6 text-sm">
          <span className="px-4 py-2 glass rounded-xl font-bold">💰 {ethers.formatEther(auction.startingPrice.toString())} ETH starting</span>
          <span className="px-4 py-2 glass rounded-xl font-bold">🔨 {auction.bidCount} bids</span>
          {isExpired ? (
            <span className="px-4 py-2 bg-red-600/20 text-red-400 rounded-xl font-bold border-2 border-red-600/50">⏰ Ended</span>
          ) : (
            <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl font-bold border-2 border-green-500/50">⏰ Active</span>
          )}
          {auction.resultsRevealed && <span className="px-4 py-2 bg-white/20 text-white rounded-xl font-bold border-2 border-white/50">✅ Results revealed</span>}
        </div>
      </div>

      {!auction.resultsRevealed && !auction.hasBid && isConnected && !isExpired && (
        <div className="mb-8">
          <p className="text-white font-black text-xl mb-6">Place your encrypted bid:</p>
          <div className="space-y-4">
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={`Minimum: ${ethers.formatEther(auction.startingPrice.toString())} ETH`}
              step="0.001"
              min={ethers.formatEther(auction.startingPrice.toString())}
              className="w-full p-6 rounded-2xl glass text-white text-lg font-bold placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={placeBid}
              disabled={loading || !bidAmount || !relayerInstance}
              className="w-full px-8 py-5 rounded-2xl gradient-bg text-white font-black text-xl hover:opacity-90 transition disabled:opacity-50 glow-hover"
            >
              {loading ? 'Placing bid...' : '🔐 Place Encrypted Bid'}
            </button>
          </div>
        </div>
      )}

      {auction.hasBid && !auction.resultsRevealed && (
        <div className="mb-8 glass rounded-2xl p-10 text-center border-2 border-green-500/50">
          <div className="text-6xl mb-4 animate-float">✅</div>
          <p className="text-white font-black text-2xl mb-2">You have placed a bid!</p>
          <p className="text-gray-400 text-lg">Results will be revealed when auction ends</p>
        </div>
      )}

      {auction.resultsRevealed && auction.winner && auction.winningBid !== undefined && (
        <div className="mb-8">
          <h3 className="text-3xl font-black text-white mb-6 gradient-text">Auction Results:</h3>
          <div className="glass rounded-2xl p-8 border-2 border-yellow-500/50">
            <div className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-white font-black text-2xl mb-2">Winner: {auction.winner.slice(0, 6)}...{auction.winner.slice(-4)}</p>
              <p className="text-yellow-400 font-bold text-xl">Winning Bid: {ethers.formatEther(auction.winningBid.toString())} ETH</p>
            </div>
          </div>
        </div>
      )}

      {isCreator && !auction.resultsRevealed && isExpired && (
        <div className="mt-8 glass rounded-2xl p-8 text-center border-2 border-yellow-500/50">
          <p className="text-gray-300 mb-4 text-lg font-bold">Auction has ended. Reveal results?</p>
          <p className="text-xs text-gray-500">
            Note: You need to calculate results using the relayer first, then call revealResults
          </p>
        </div>
      )}
    </div>
  )
}

