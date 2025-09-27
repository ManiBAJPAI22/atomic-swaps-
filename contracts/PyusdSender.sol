// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract PyusdSender {
    address public owner;
    IERC20 public pyusdToken;
    
    event PyusdSent(address indexed to, uint256 amount, string reason);
    
    constructor(address _pyusdToken) {
        owner = msg.sender;
        pyusdToken = IERC20(_pyusdToken);
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    function sendPyusdToMaker(address makerAddress, uint256 amount, string memory reason) external onlyOwner {
        require(pyusdToken.balanceOf(address(this)) >= amount, "Insufficient PYUSD balance");
        
        bool success = pyusdToken.transfer(makerAddress, amount);
        require(success, "PYUSD transfer failed");
        
        emit PyusdSent(makerAddress, amount, reason);
    }
    
    function getPyusdBalance() external view returns (uint256) {
        return pyusdToken.balanceOf(address(this));
    }
    
    function getContractAddress() external view returns (address) {
        return address(this);
    }
}
