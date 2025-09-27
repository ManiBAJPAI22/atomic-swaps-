// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract Escrow {
    address public owner;
    IERC20 public pyusdToken;
    address public makerAddress;
    
    event PyusdSentToMaker(address indexed maker, uint256 amount, string swapId);
    event EscrowFunded(uint256 amount);
    
    constructor(address _pyusdToken, address _makerAddress) {
        owner = msg.sender;
        pyusdToken = IERC20(_pyusdToken);
        makerAddress = _makerAddress;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    // Fund the escrow with PYUSD (call this after deployment)
    function fundEscrow(uint256 amount) external onlyOwner {
        require(pyusdToken.balanceOf(msg.sender) >= amount, "Insufficient PYUSD balance");
        pyusdToken.transferFrom(msg.sender, address(this), amount);
        emit EscrowFunded(amount);
    }
    
    // Complete the swap by sending PYUSD to maker
    function completeSwap(uint256 amount, string memory swapId) external onlyOwner {
        require(pyusdToken.balanceOf(address(this)) >= amount, "Insufficient escrow balance");
        pyusdToken.transfer(makerAddress, amount);
        emit PyusdSentToMaker(makerAddress, amount, swapId);
    }
    
    // Emergency function to withdraw PYUSD (only owner)
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        pyusdToken.transfer(owner, amount);
    }
    
    // Get escrow balance
    function getEscrowBalance() external view returns (uint256) {
        return pyusdToken.balanceOf(address(this));
    }
    
    // Get contract info
    function getContractInfo() external view returns (
        address _owner,
        address _pyusdToken,
        address _makerAddress,
        uint256 _balance
    ) {
        return (
            owner,
            address(pyusdToken),
            makerAddress,
            pyusdToken.balanceOf(address(this))
        );
    }
}
