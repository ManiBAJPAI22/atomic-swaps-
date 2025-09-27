"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoPayManager = void 0;
const ethers_1 = require("ethers");
const contracts_1 = require("./contracts");
const AUTOPAY_ABI = [
    "function startAutoPay() external",
    "function executePayment() external",
    "function pauseAutoPay() external",
    "function resumeAutoPay() external",
    "function stopAutoPay() external",
    "function withdrawRemainingFunds() external",
    "function updateBalance() external",
    "function getAutoPayInfo() external view returns (address, address, uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool)",
    "function getNextPaymentTime() external view returns (uint256)",
    "function getTimeRemaining() external view returns (uint256)",
    "event PaymentSent(address indexed merchant, uint256 amount, uint256 timestamp)",
    "event AutoPayStarted(uint256 startTime, uint256 totalDuration)",
    "event AutoPayPaused(uint256 timestamp)",
    "event AutoPayResumed(uint256 timestamp)",
    "event AutoPayStopped(uint256 timestamp, uint256 totalPaid)",
    "event FundsWithdrawn(address indexed owner, uint256 amount)"
];
class AutoPayManager {
    constructor(rpcUrl, ownerPrivateKey, autopayAddress, pyusdAddress) {
        this.provider = new ethers_1.JsonRpcProvider(rpcUrl, {
            name: 'sepolia',
            chainId: 11155111
        });
        this.ownerWallet = new ethers_1.Wallet(ownerPrivateKey, this.provider);
        this.autopayContract = new ethers_1.Contract(autopayAddress, AUTOPAY_ABI, this.ownerWallet);
        this.pyusdContract = new ethers_1.Contract(pyusdAddress, contracts_1.PYUSD_ABI, this.provider);
        this.pyusdAddress = pyusdAddress;
    }
    async getAutoPayInfo() {
        const info = await this.autopayContract.getAutoPayInfo();
        return {
            owner: info[0],
            merchant: info[1],
            paymentAmount: info[2],
            paymentInterval: info[3],
            totalDuration: info[4],
            startTime: info[5],
            lastPaymentTime: info[6],
            totalPaid: info[7],
            remainingBalance: info[8],
            isActive: info[9],
            isPaused: info[10]
        };
    }
    async startAutoPay() {
        console.log('🚀 Starting AutoPay...');
        const tx = await this.autopayContract.startAutoPay();
        await tx.wait();
        console.log('✅ AutoPay started:', tx.hash);
        return tx.hash;
    }
    async executePayment() {
        console.log('💰 Executing payment...');
        const tx = await this.autopayContract.executePayment();
        await tx.wait();
        console.log('✅ Payment executed:', tx.hash);
        return tx.hash;
    }
    async pauseAutoPay() {
        console.log('⏸️  Pausing AutoPay...');
        const tx = await this.autopayContract.pauseAutoPay();
        await tx.wait();
        console.log('✅ AutoPay paused:', tx.hash);
        return tx.hash;
    }
    async resumeAutoPay() {
        console.log('▶️  Resuming AutoPay...');
        const tx = await this.autopayContract.resumeAutoPay();
        await tx.wait();
        console.log('✅ AutoPay resumed:', tx.hash);
        return tx.hash;
    }
    async stopAutoPay() {
        console.log('🛑 Stopping AutoPay...');
        const tx = await this.autopayContract.stopAutoPay();
        await tx.wait();
        console.log('✅ AutoPay stopped:', tx.hash);
        return tx.hash;
    }
    async withdrawRemainingFunds() {
        console.log('💸 Withdrawing remaining funds...');
        const tx = await this.autopayContract.withdrawRemainingFunds();
        await tx.wait();
        console.log('✅ Funds withdrawn:', tx.hash);
        return tx.hash;
    }
    async getNextPaymentTime() {
        return this.autopayContract.getNextPaymentTime();
    }
    async getTimeRemaining() {
        return this.autopayContract.getTimeRemaining();
    }
    async checkMerchantBalance() {
        const info = await this.getAutoPayInfo();
        return this.pyusdContract.balanceOf(info.merchant);
    }
    async updateBalance() {
        console.log('🔄 Updating contract balance...');
        const tx = await this.autopayContract.updateBalance();
        await tx.wait();
        console.log('✅ Balance updated:', tx.hash);
        return tx.hash;
    }
}
exports.AutoPayManager = AutoPayManager;
//# sourceMappingURL=autopay-manager.js.map