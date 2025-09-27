// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract AutoPay {
    address public owner;
    address public merchant;
    IERC20 public pyusdToken;
    
    uint256 public paymentAmount;
    uint256 public paymentInterval;
    uint256 public totalDuration;
    uint256 public startTime;
    uint256 public lastPaymentTime;
    uint256 public totalPaid;
    uint256 public remainingBalance;
    
    bool public isActive;
    bool public isPaused;
    
    event PaymentSent(address indexed merchant, uint256 amount, uint256 timestamp);
    event AutoPayStarted(uint256 startTime, uint256 totalDuration);
    event AutoPayPaused(uint256 timestamp);
    event AutoPayResumed(uint256 timestamp);
    event AutoPayStopped(uint256 timestamp, uint256 totalPaid);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier whenActive() {
        require(isActive && !isPaused, "AutoPay is not active");
        _;
    }
    
    constructor(
        address _merchant,
        uint256 _paymentAmount,
        uint256 _paymentInterval,
        uint256 _totalDuration,
        address _pyusdToken
    ) {
        owner = msg.sender;
        merchant = _merchant;
        paymentAmount = _paymentAmount;
        paymentInterval = _paymentInterval;
        totalDuration = _totalDuration;
        pyusdToken = IERC20(_pyusdToken);
        remainingBalance = 0; // Will be updated when PYUSD is transferred
    }
    
    function updateBalance() external {
        remainingBalance = pyusdToken.balanceOf(address(this));
    }
    
    function startAutoPay() external onlyOwner {
        require(!isActive, "AutoPay is already active");
        
        // Update balance before checking
        remainingBalance = pyusdToken.balanceOf(address(this));
        require(remainingBalance >= paymentAmount, "Insufficient balance for first payment");
        
        isActive = true;
        isPaused = false;
        startTime = block.timestamp;
        lastPaymentTime = block.timestamp;
        
        emit AutoPayStarted(startTime, totalDuration);
    }
    
    function executePayment() external {
        require(isActive && !isPaused, "AutoPay is not active");
        require(block.timestamp >= lastPaymentTime + paymentInterval, "Payment interval not reached");
        require(remainingBalance >= paymentAmount, "Insufficient balance for payment");
        require(block.timestamp <= startTime + totalDuration, "AutoPay duration expired");
        
        // Execute payment
        require(pyusdToken.transfer(merchant, paymentAmount), "Payment transfer failed");
        
        lastPaymentTime = block.timestamp;
        totalPaid += paymentAmount;
        remainingBalance -= paymentAmount;
        
        emit PaymentSent(merchant, paymentAmount, block.timestamp);
        
        // Check if duration expired or insufficient balance
        if (block.timestamp >= startTime + totalDuration || remainingBalance < paymentAmount) {
            isActive = false;
            emit AutoPayStopped(block.timestamp, totalPaid);
        }
    }
    
    function pauseAutoPay() external onlyOwner {
        require(isActive && !isPaused, "AutoPay is not active or already paused");
        isPaused = true;
        emit AutoPayPaused(block.timestamp);
    }
    
    function resumeAutoPay() external onlyOwner {
        require(isActive && isPaused, "AutoPay is not active or not paused");
        isPaused = false;
        emit AutoPayResumed(block.timestamp);
    }
    
    function stopAutoPay() external onlyOwner {
        require(isActive, "AutoPay is not active");
        isActive = false;
        isPaused = false;
        emit AutoPayStopped(block.timestamp, totalPaid);
    }
    
    function withdrawRemainingFunds() external onlyOwner {
        require(!isActive, "Cannot withdraw while AutoPay is active");
        
        uint256 amount = remainingBalance;
        remainingBalance = 0;
        
        require(pyusdToken.transfer(owner, amount), "Withdrawal transfer failed");
        emit FundsWithdrawn(owner, amount);
    }
    
    function getAutoPayInfo() external view returns (
        address _owner,
        address _merchant,
        uint256 _paymentAmount,
        uint256 _paymentInterval,
        uint256 _totalDuration,
        uint256 _startTime,
        uint256 _lastPaymentTime,
        uint256 _totalPaid,
        uint256 _remainingBalance,
        bool _isActive,
        bool _isPaused
    ) {
        return (
            owner,
            merchant,
            paymentAmount,
            paymentInterval,
            totalDuration,
            startTime,
            lastPaymentTime,
            totalPaid,
            remainingBalance,
            isActive,
            isPaused
        );
    }
    
    function getNextPaymentTime() external view returns (uint256) {
        if (!isActive || isPaused) return 0;
        return lastPaymentTime + paymentInterval;
    }
    
    function getTimeRemaining() external view returns (uint256) {
        if (!isActive) return 0;
        uint256 endTime = startTime + totalDuration;
        if (block.timestamp >= endTime) return 0;
        return endTime - block.timestamp;
    }
}
