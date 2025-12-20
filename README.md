# Secret Auction

Encrypted bidding on blockchain. Your bids are secret until auction ends.

## What is this?

Create auctions, place encrypted bids, reveal winner. Simple.

- 🔐 **Encrypted Bids**: Your bid is encrypted before hitting the blockchain
- 👁️ **Private**: Nobody sees your bid until auction ends
- 🏆 **Fair**: Winner revealed after auction ends
- ⛓️ **On Blockchain**: All auctions stored on Ethereum Sepolia testnet

## Quick Start

1. Get some Sepolia testnet ETH from a faucet
2. Connect your MetaMask wallet
3. Create an auction or bid in existing ones
4. That's it

## Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Setup

Create `.env.local`:

```
NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS=0x5fe24305aFDcf0F3E8651B0E35C9c3a93EF1c52c
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Contract

- Address: `0x5fe24305aFDcf0F3E8651B0E35C9c3a93EF1c52c`
- Network: Sepolia Testnet
- [View on Etherscan](https://sepolia.etherscan.io/address/0x5fe24305aFDcf0F3E8651B0E35C9c3a93EF1c52c)

## Tech

- Next.js
- TypeScript
- Tailwind CSS
- Wagmi & RainbowKit
- Hardhat
- Zama FHEVM Relayer

## Deploy Contract

```bash
npm run deploy:auction
```

## Notes

- This is on Sepolia testnet - test ETH only
- Bids cost gas
- Needs Zama relayer for encryption
- Demo project - don't use for real auctions

## Live

Deployed on Vercel: https://secretauction.vercel.app

---

Made with Zama FHEVM
