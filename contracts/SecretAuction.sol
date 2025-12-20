// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Secret auction where bids are encrypted
// Relayer encrypts bids before sending to contract
// Only creator can reveal winner after auction ends
contract SecretAuction {
    struct Auction {
        address creator;
        string itemName;
        string description;
        uint256 startingPrice;
        bytes32[] encryptedBids;
        address[] bidders;
        mapping(address => bool) hasBid;
        bool isActive;
        bool resultsRevealed;
        uint256 createdAt;
        uint256 endTime;
        address winner;
        uint256 winningBid;
    }

    mapping(uint256 => Auction) public auctions;
    uint256 public auctionCounter;
    
    mapping(address => uint256[]) public userAuctions;
    mapping(address => uint256[]) public userBids;

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed creator,
        string itemName,
        uint256 endTime
    );
    
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder
    );
    
    event ResultsRevealed(
        uint256 indexed auctionId,
        address winner,
        uint256 winningBid
    );
    
    event AuctionEnded(uint256 indexed auctionId);

    // Create new auction
    function createAuction(
        string memory itemName,
        string memory description,
        uint256 startingPrice,
        uint256 duration
    ) external returns (uint256) {
        require(bytes(itemName).length > 0, "Item name cannot be empty");
        require(startingPrice > 0, "Starting price must be positive");
        require(duration > 0, "Duration must be positive");

        uint256 auctionId = auctionCounter;
        auctionCounter++;

        Auction storage auction = auctions[auctionId];
        auction.creator = msg.sender;
        auction.itemName = itemName;
        auction.description = description;
        auction.startingPrice = startingPrice;
        auction.isActive = true;
        auction.resultsRevealed = false;
        auction.createdAt = block.timestamp;
        auction.endTime = block.timestamp + duration;

        userAuctions[msg.sender].push(auctionId);

        emit AuctionCreated(auctionId, msg.sender, itemName, auction.endTime);
        return auctionId;
    }

    // Place encrypted bid
    // Frontend encrypts bid using relayer, then sends encrypted handle here
    function placeBid(
        uint256 auctionId,
        bytes32 encryptedBid,
        bytes calldata /* attestation */
    ) external {
        Auction storage auction = auctions[auctionId];
        require(auction.isActive, "Auction is not active");
        require(block.timestamp < auction.endTime, "Auction has ended");
        require(!auction.hasBid[msg.sender], "Already bid");
        require(encryptedBid != bytes32(0), "Invalid encrypted bid");

        auction.encryptedBids.push(encryptedBid);
        auction.bidders.push(msg.sender);
        auction.hasBid[msg.sender] = true;

        userBids[msg.sender].push(auctionId);

        emit BidPlaced(auctionId, msg.sender);
    }

    // Reveal winner after auction ends
    // Creator uses relayer to decrypt bids and find max, then calls this
    function revealResults(
        uint256 auctionId,
        address winner,
        uint256 winningBid
    ) external {
        Auction storage auction = auctions[auctionId];
        require(msg.sender == auction.creator, "Only creator can reveal");
        require(!auction.resultsRevealed, "Results already revealed");
        require(block.timestamp >= auction.endTime || !auction.isActive, "Auction still active");
        require(winningBid >= auction.startingPrice, "Winning bid too low");

        auction.winner = winner;
        auction.winningBid = winningBid;
        auction.resultsRevealed = true;
        auction.isActive = false;

        emit ResultsRevealed(auctionId, winner, winningBid);
        emit AuctionEnded(auctionId);
    }

    // End auction early
    function endAuction(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];
        require(msg.sender == auction.creator, "Only creator can end auction");
        require(auction.isActive, "Auction already ended");
        
        auction.isActive = false;
        emit AuctionEnded(auctionId);
    }

    // Get auction info
    function getAuction(uint256 auctionId) external view returns (
        address creator,
        string memory itemName,
        string memory description,
        uint256 startingPrice,
        bool isActive,
        bool resultsRevealed,
        uint256 createdAt,
        uint256 endTime,
        uint256 bidCount
    ) {
        Auction storage auction = auctions[auctionId];
        return (
            auction.creator,
            auction.itemName,
            auction.description,
            auction.startingPrice,
            auction.isActive,
            auction.resultsRevealed,
            auction.createdAt,
            auction.endTime,
            auction.bidders.length
        );
    }

    // Get results if revealed
    function getResults(uint256 auctionId) external view returns (
        address winner,
        uint256 winningBid,
        bool revealed
    ) {
        Auction storage auction = auctions[auctionId];
        return (auction.winner, auction.winningBid, auction.resultsRevealed);
    }

    // Get bid count
    function getBidCount(uint256 auctionId) external view returns (uint256) {
        return auctions[auctionId].bidders.length;
    }

    // Check if user bid
    function hasBid(uint256 auctionId, address bidder) external view returns (bool) {
        return auctions[auctionId].hasBid[bidder];
    }

    // Get auctions user created
    function getUserAuctions(address user) external view returns (uint256[] memory) {
        return userAuctions[user];
    }

    // Get auctions user bid in
    function getUserBids(address user) external view returns (uint256[] memory) {
        return userBids[user];
    }
}
