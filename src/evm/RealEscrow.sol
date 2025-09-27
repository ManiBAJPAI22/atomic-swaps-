// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RealEscrow {
    struct SwapData {
        address maker;
        address taker;
        uint256 amount;
        bytes32 orderHash;
        bytes32 hashLock;
        uint256 timelock;
        bool isWithdrawn;
        bool isCancelled;
    }

    mapping(address => SwapData) public swaps;
    
    event EscrowCreated(
        address indexed escrowAddress,
        address indexed maker,
        address indexed taker,
        uint256 amount,
        bytes32 orderHash
    );
    
    event EscrowWithdrawn(address indexed escrowAddress, bytes32 secret);
    event EscrowCancelled(address indexed escrowAddress);

    function createEscrow(
        address maker,
        address taker,
        uint256 amount,
        bytes32 orderHash,
        bytes32 hashLock,
        uint256 timelock
    ) external payable returns (address) {
        require(msg.value >= amount, "Insufficient ETH sent");
        require(maker != address(0), "Invalid maker address");
        require(taker != address(0), "Invalid taker address");
        require(amount > 0, "Amount must be greater than 0");
        require(timelock > block.timestamp, "Timelock must be in the future");

        address escrowAddress = address(this);
        
        swaps[escrowAddress] = SwapData({
            maker: maker,
            taker: taker,
            amount: amount,
            orderHash: orderHash,
            hashLock: hashLock,
            timelock: timelock,
            isWithdrawn: false,
            isCancelled: false
        });

        emit EscrowCreated(escrowAddress, maker, taker, amount, orderHash);
        return escrowAddress;
    }

    function withdraw(bytes32 secret) external {
        address escrowAddress = address(this);
        SwapData storage swap = swaps[escrowAddress];
        
        require(!swap.isWithdrawn, "Already withdrawn");
        require(!swap.isCancelled, "Escrow cancelled");
        require(keccak256(abi.encodePacked(secret)) == swap.hashLock, "Invalid secret");
        
        swap.isWithdrawn = true;
        
        // Transfer ETH to the caller
        payable(msg.sender).transfer(swap.amount);
        
        emit EscrowWithdrawn(escrowAddress, secret);
    }

    function cancel() external {
        address escrowAddress = address(this);
        SwapData storage swap = swaps[escrowAddress];
        
        require(!swap.isWithdrawn, "Already withdrawn");
        require(!swap.isCancelled, "Already cancelled");
        require(block.timestamp >= swap.timelock, "Timelock not reached");
        require(msg.sender == swap.maker, "Only maker can cancel");
        
        swap.isCancelled = true;
        
        // Return ETH to maker
        payable(swap.maker).transfer(swap.amount);
        
        emit EscrowCancelled(escrowAddress);
    }

    function getOrderHash() external view returns (bytes32) {
        return swaps[address(this)].orderHash;
    }

    function getHashLock() external view returns (bytes32) {
        return swaps[address(this)].hashLock;
    }

    function getMaker() external view returns (address) {
        return swaps[address(this)].maker;
    }

    function getTaker() external view returns (address) {
        return swaps[address(this)].taker;
    }

    function getAmount() external view returns (uint256) {
        return swaps[address(this)].amount;
    }

    function getTimelock() external view returns (uint256) {
        return swaps[address(this)].timelock;
    }

    function isWithdrawn() external view returns (bool) {
        return swaps[address(this)].isWithdrawn;
    }

    function isCancelled() external view returns (bool) {
        return swaps[address(this)].isCancelled;
    }

    // Fallback function to receive ETH
    receive() external payable {}
}
