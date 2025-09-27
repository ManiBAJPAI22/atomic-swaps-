import { ethers, Wallet, JsonRpcProvider, Contract } from 'ethers';
import { PYUSD_ABI } from '../evm/contracts';

export class RealisticMockProvider {
  private prefundedWallet: Wallet;
  private provider: JsonRpcProvider;
  private pyusdContract: Contract;

  constructor(rpcUrl: string, prefundedPrivateKey: string, pyusdAddress: string) {
    // Use the working RPC URL
    const workingRpcUrl = rpcUrl.includes('YOUR_KEY') ? 'https://eth-sepolia.g.alchemy.com/v2/CQENf_IMmkawSrqgpR14l' : rpcUrl;
    this.provider = new JsonRpcProvider(workingRpcUrl, {
      name: 'sepolia',
      chainId: 11155111
    });
    this.prefundedWallet = new Wallet(prefundedPrivateKey, this.provider);
    this.pyusdContract = new Contract(pyusdAddress, PYUSD_ABI, this.prefundedWallet);
  }

  public async getPrefundedAddress(): Promise<string> {
    return this.prefundedWallet.address;
  }

  public async getPyusdBalance(): Promise<bigint> {
    return this.pyusdContract.balanceOf(this.prefundedWallet.address);
  }

  public async sendPyusdToMaker(makerAddress: string, amount: bigint): Promise<string> {
    console.log(`💰 Sending ${amount.toString()} PYUSD from prefunded account to maker...`);
    console.log(`📤 From: ${this.prefundedWallet.address}`);
    console.log(`📥 To: ${makerAddress}`);
    
    try {
      const tx = await this.pyusdContract.transfer(makerAddress, amount);
      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ PYUSD transfer confirmed in block ${receipt.blockNumber}`);
      console.log(`🔗 Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`);
      
      return tx.hash;
    } catch (error) {
      console.error('❌ Failed to send PYUSD:', error);
      throw error;
    }
  }

  public async checkMakerPyusdBalance(makerAddress: string): Promise<bigint> {
    return this.pyusdContract.balanceOf(makerAddress);
  }

  public async getPyusdInfo(): Promise<{name: string, symbol: string, decimals: number}> {
    const [name, symbol, decimals] = await Promise.all([
      this.pyusdContract.name(),
      this.pyusdContract.symbol(),
      this.pyusdContract.decimals()
    ]);
    return { name, symbol, decimals };
  }
}
