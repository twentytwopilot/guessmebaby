import hre from 'hardhat'
const { ethers } = hre

async function main() {
  const signers = await ethers.getSigners()
  if (signers.length === 0) {
    throw new Error('No signers available. Check PRIVATE_KEY in .env.local')
  }
  const deployer = signers[0]

  console.log('Deploying SecretAuction...')
  console.log('Deployer:', deployer.address)

  const SecretAuction = await ethers.getContractFactory('SecretAuction')
  const auction = await SecretAuction.deploy()
  await auction.waitForDeployment()

  const address = await auction.getAddress()
  console.log('Deployed to:', address)

  // Test creating an auction
  const tx = await auction.createAuction(
    'Rare NFT Art',
    'One of a kind digital artwork',
    100,
    3600
  )
  const receipt = await tx.wait()
  
  // Find auction ID from event
  const event = receipt?.logs.find((log: any) => {
    try {
      const parsed = auction.interface.parseLog(log)
      return parsed?.name === 'AuctionCreated'
    } catch {
      return false
    }
  })

  if (event) {
    const parsed = auction.interface.parseLog(event)
    const auctionId = parsed?.args.auctionId
    console.log('Test auction created:', auctionId.toString())
  }

  console.log('Done!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

