import { ethers, Wallet, JsonRpcProvider, Contract } from 'ethers';

// Escrow contract ABI
const ESCROW_ABI = [
  "constructor(address _pyusdToken, address _makerAddress)",
  "function fundEscrow(uint256 amount) external",
  "function completeSwap(uint256 amount, string memory swapId) external",
  "function getEscrowBalance() external view returns (uint256)",
  "function getContractInfo() external view returns (address, address, address, uint256)",
  "event PyusdSentToMaker(address indexed maker, uint256 amount, string swapId)",
  "event EscrowFunded(uint256 amount)"
];

const PYUSD_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)"
];

export class EscrowManager {
  private escrowContract: Contract;
  private pyusdContract: Contract;
  private wallet: Wallet;
  private provider: JsonRpcProvider;

  constructor(
    rpcUrl: string, 
    privateKey: string, 
    escrowAddress: string, 
    pyusdAddress: string
  ) {
    this.provider = new JsonRpcProvider(rpcUrl, {
      name: 'sepolia',
      chainId: 11155111
    });
    this.wallet = new Wallet(privateKey, this.provider);
    this.escrowContract = new Contract(escrowAddress, ESCROW_ABI, this.wallet);
    this.pyusdContract = new Contract(pyusdAddress, PYUSD_ABI, this.wallet);
  }

  public async getEscrowInfo(): Promise<{
    owner: string;
    pyusdToken: string;
    makerAddress: string;
    balance: bigint;
  }> {
    const [owner, pyusdToken, makerAddress, balance] = await this.escrowContract.getContractInfo();
    return {
      owner,
      pyusdToken,
      makerAddress,
      balance
    };
  }

  public async getEscrowBalance(): Promise<bigint> {
    return this.escrowContract.getEscrowBalance();
  }

  public async fundEscrow(amount: bigint): Promise<string> {
    console.log(`💰 Funding escrow with ${ethers.formatUnits(amount, 6)} PYUSD...`);
    
    // First approve the escrow to spend PYUSD
    const approveTx = await this.pyusdContract.approve(this.escrowContract.target, amount);
    console.log('⏳ Approving PYUSD transfer...', approveTx.hash);
    await approveTx.wait();
    console.log('✅ PYUSD approval confirmed');

    // Then fund the escrow
    const fundTx = await this.escrowContract.fundEscrow(amount);
    console.log('⏳ Funding escrow...', fundTx.hash);
    const receipt = await fundTx.wait();
    console.log('✅ Escrow funded in block', receipt.blockNumber);
    
    return fundTx.hash;
  }

  public async completeSwap(amount: bigint, swapId: string): Promise<string> {
    console.log(`🎯 Completing swap via Escrow contract...`);
    console.log(`📤 Amount: ${ethers.formatUnits(amount, 6)} PYUSD`);
    console.log(`🆔 Swap ID: ${swapId}`);
    
    const tx = await this.escrowContract.completeSwap(amount, swapId);
    console.log('⏳ Escrow transaction submitted:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ PYUSD sent to maker via Escrow in block', receipt.blockNumber);
    console.log('🔗 Explorer: https://sepolia.etherscan.io/tx/' + tx.hash);
    
    return tx.hash;
  }

  public async checkMakerBalance(): Promise<bigint> {
    const info = await this.getEscrowInfo();
    return this.pyusdContract.balanceOf(info.makerAddress);
  }
}
