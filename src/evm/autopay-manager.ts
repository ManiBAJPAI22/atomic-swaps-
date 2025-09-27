import { ethers, Wallet, JsonRpcProvider, Contract } from 'ethers';
import { PYUSD_ABI } from './contracts';

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

export class AutoPayManager {
  private ownerWallet: Wallet;
  private provider: JsonRpcProvider;
  private autopayContract: Contract;
  private pyusdContract: Contract;
  private pyusdAddress: string;

  constructor(
    rpcUrl: string,
    ownerPrivateKey: string,
    autopayAddress: string,
    pyusdAddress: string
  ) {
    this.provider = new JsonRpcProvider(rpcUrl, {
      name: 'sepolia',
      chainId: 11155111
    });
    this.ownerWallet = new Wallet(ownerPrivateKey, this.provider);
    this.autopayContract = new Contract(autopayAddress, AUTOPAY_ABI, this.ownerWallet);
    this.pyusdContract = new Contract(pyusdAddress, PYUSD_ABI, this.provider);
    this.pyusdAddress = pyusdAddress;
  }

  public async getAutoPayInfo(): Promise<{
    owner: string;
    merchant: string;
    paymentAmount: bigint;
    paymentInterval: bigint;
    totalDuration: bigint;
    startTime: bigint;
    lastPaymentTime: bigint;
    totalPaid: bigint;
    remainingBalance: bigint;
    isActive: boolean;
    isPaused: boolean;
  }> {
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

  public async startAutoPay(): Promise<string> {
    console.log('🚀 Starting AutoPay...');
    const tx = await this.autopayContract.startAutoPay();
    await tx.wait();
    console.log('✅ AutoPay started:', tx.hash);
    return tx.hash;
  }

  public async executePayment(): Promise<string> {
    console.log('💰 Executing payment...');
    const tx = await this.autopayContract.executePayment();
    await tx.wait();
    console.log('✅ Payment executed:', tx.hash);
    return tx.hash;
  }

  public async pauseAutoPay(): Promise<string> {
    console.log('⏸️  Pausing AutoPay...');
    const tx = await this.autopayContract.pauseAutoPay();
    await tx.wait();
    console.log('✅ AutoPay paused:', tx.hash);
    return tx.hash;
  }

  public async resumeAutoPay(): Promise<string> {
    console.log('▶️  Resuming AutoPay...');
    const tx = await this.autopayContract.resumeAutoPay();
    await tx.wait();
    console.log('✅ AutoPay resumed:', tx.hash);
    return tx.hash;
  }

  public async stopAutoPay(): Promise<string> {
    console.log('🛑 Stopping AutoPay...');
    const tx = await this.autopayContract.stopAutoPay();
    await tx.wait();
    console.log('✅ AutoPay stopped:', tx.hash);
    return tx.hash;
  }

  public async withdrawRemainingFunds(): Promise<string> {
    console.log('💸 Withdrawing remaining funds...');
    const tx = await this.autopayContract.withdrawRemainingFunds();
    await tx.wait();
    console.log('✅ Funds withdrawn:', tx.hash);
    return tx.hash;
  }

  public async getNextPaymentTime(): Promise<bigint> {
    return this.autopayContract.getNextPaymentTime();
  }

  public async getTimeRemaining(): Promise<bigint> {
    return this.autopayContract.getTimeRemaining();
  }

  public async checkMerchantBalance(): Promise<bigint> {
    const info = await this.getAutoPayInfo();
    return this.pyusdContract.balanceOf(info.merchant);
  }

  public async updateBalance(): Promise<string> {
    console.log('🔄 Updating contract balance...');
    const tx = await this.autopayContract.updateBalance();
    await tx.wait();
    console.log('✅ Balance updated:', tx.hash);
    return tx.hash;
  }
}
