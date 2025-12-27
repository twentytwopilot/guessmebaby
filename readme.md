# ░▒▓ Hidden Number Battle ▓▒░

> Encrypted number guessing game  
> Neon logic • Silent data • On-chain secrecy

---

## ⚙️ SYSTEM OVERVIEW

**Hidden Number Battle** is a decentralized guessing game  
where all player inputs exist only in encrypted form.

No plaintext.  
No observers.  
No data leaks.

The blockchain executes logic on data it cannot read.

---

## 🧬 CORE PRINCIPLE

All numbers are encrypted using **Fully Homomorphic Encryption (FHE)**  
*before* being sent on-chain.

Smart contracts operate directly on ciphertext.  
Decryption happens only at the final reveal.

---

## 🧩 FEATURES

- ▓ **Client-Side Encryption**  
  Numbers are encrypted locally in the browser

- ▓ **Encrypted On-Chain Logic**  
  Game logic runs directly on encrypted values

- ▓ **Zero Knowledge of Guesses**  
  No player, contract, or validator sees raw numbers

- ▓ **Wallet-Native Access**  
  MetaMask and WalletConnect supported

- ▓ **Minimal Cyberpunk UI**  
  Dark theme with restrained neon accents

---

## 🕶️ DATA FLOW

```
User Input
   ↓
Local FHE Encryption
   ↓
Encrypted On-Chain Storage
   ↓
Encrypted Computation
   ↓
Final Reveal
```

Plaintext is never exposed during gameplay.

---

## 🚀 QUICK START

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open:
```
http://localhost:3000
```

---

## 🛠 BUILD & DEPLOY

```bash
npm run build
npm start
```

### Smart Contracts

```bash
npm run compile
npm run deploy:auction
```

Network:
```
Ethereum Sepolia Testnet
```

---

## 🧠 TECH STACK

- **Frontend**: Next.js, TypeScript, Tailwind CSS  
- **Web3**: Wagmi, Ethers.js  
- **Encryption**: Zama FHEVM  
- **Blockchain**: Ethereum (Sepolia)

---

## ░▒▓ PHILOSOPHY ▓▒░

Privacy is not a feature.  
It is a system property.

If data can be read — it can be exploited.  
Here, it cannot be read.

---

## 📜 LICENSE

MIT
