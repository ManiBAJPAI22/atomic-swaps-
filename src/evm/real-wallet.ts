import { ethers, Wallet, JsonRpcProvider, Contract } from 'ethers';
import { EvmWallet } from '../types';

// Real Escrow Contract ABI
const REAL_ESCROW_ABI = [
  "function createEscrow(address maker, address taker, uint256 amount, bytes32 orderHash, bytes32 hashLock, uint256 timelock) external payable returns (address)",
  "function withdraw(bytes32 secret) external",
  "function cancel() external",
  "function getOrderHash() external view returns (bytes32)",
  "function getHashLock() external view returns (bytes32)",
  "function getMaker() external view returns (address)",
  "function getTaker() external view returns (address)",
  "function getAmount() external view returns (uint256)",
  "function getTimelock() external view returns (uint256)",
  "function isWithdrawn() external view returns (bool)",
  "function isCancelled() external view returns (bool)",
  "event EscrowCreated(address indexed escrowAddress, address indexed maker, address indexed taker, uint256 amount, bytes32 orderHash)",
  "event EscrowWithdrawn(address indexed escrowAddress, bytes32 secret)",
  "event EscrowCancelled(address indexed escrowAddress)"
];

export class RealEvmWalletManager {
  private wallet: EvmWallet;
  private provider: JsonRpcProvider;
  private escrowContractAddress: string;

  constructor(privateKey: string, rpcUrl: string, escrowContractAddress: string) {
    this.provider = new JsonRpcProvider(rpcUrl, {
      name: 'sepolia',
      chainId: 11155111
    });
    const wallet = new Wallet(privateKey, this.provider);
    
    this.wallet = {
      address: wallet.address,
      privateKey,
      provider: this.provider,
      signer: wallet
    };
    
    this.escrowContractAddress = escrowContractAddress;
  }

  getWallet(): EvmWallet {
    return this.wallet;
  }

  async getBalance(tokenAddress?: string): Promise<bigint> {
    try {
      if (tokenAddress) {
        const contract = new Contract(tokenAddress, [
          "function balanceOf(address owner) external view returns (uint256)"
        ], this.wallet.signer);
        return await contract.balanceOf(this.wallet.address);
      } else {
        const balance = await this.provider.getBalance(this.wallet.address);
        console.log(`💰 EVM Balance: ${ethers.formatEther(balance)} ETH`);
        return balance;
      }
    } catch (error: any) {
      console.error(`❌ Error getting balance:`, error.message);
      throw error;
    }
  }

  async createRealEscrow(
    maker: string,
    taker: string,
    amount: bigint,
    orderHash: string,
    hashLock: string,
    timelock: bigint
  ): Promise<string> {
    try {
      console.log(`🏗️ Creating real EVM escrow...`);
      console.log(`   Maker: ${maker}`);
      console.log(`   Taker: ${taker}`);
      console.log(`   Amount: ${ethers.formatEther(amount)} ETH`);
      console.log(`   Order Hash: ${orderHash}`);
      console.log(`   Hash Lock: ${hashLock}`);
      console.log(`   Timelock: ${new Date(Number(timelock) * 1000).toISOString()}`);

      const escrowContract = new Contract(this.escrowContractAddress, REAL_ESCROW_ABI, this.wallet.signer);

      // Estimate gas
      const gasEstimate = await escrowContract.createEscrow.estimateGas(
        maker,
        taker,
        amount,
        orderHash,
        hashLock,
        timelock,
        { value: amount }
      );

      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);

      // Create the escrow
      const tx = await escrowContract.createEscrow(
        maker,
        taker,
        amount,
        orderHash,
        hashLock,
        timelock,
        { 
          value: amount,
          gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
        }
      );

      console.log(`📡 Transaction submitted: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);

      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log(`✅ Escrow created successfully!`);
        console.log(`   Transaction Hash: ${tx.hash}`);
        console.log(`   Block Number: ${receipt.blockNumber}`);
        console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
        
        // Find the EscrowCreated event
        const event = receipt.logs.find((log: any) => {
          try {
            const parsed = escrowContract.interface.parseLog(log);
            return parsed?.name === 'EscrowCreated';
          } catch {
            return false;
          }
        });

        if (event) {
          const parsed = escrowContract.interface.parseLog(event);
          console.log(`   Escrow Address: ${parsed?.args.escrowAddress}`);
        }
        
        return tx.hash;
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error(`❌ Error creating escrow:`, error.message);
      throw error;
    }
  }

  async withdrawFromRealEscrow(
    escrowAddress: string,
    secret: string
  ): Promise<string> {
    try {
      console.log(`🔓 Withdrawing from real EVM escrow...`);
      console.log(`   Escrow Address: ${escrowAddress}`);
      console.log(`   Secret: ${secret}`);

      const escrowContract = new Contract(escrowAddress, REAL_ESCROW_ABI, this.wallet.signer);

      // Estimate gas
      const gasEstimate = await escrowContract.withdraw.estimateGas(secret);
      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);

      // Withdraw
      const tx = await escrowContract.withdraw(secret, {
        gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
      });

      console.log(`📡 Withdrawal transaction submitted: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);

      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log(`✅ Withdrawal successful!`);
        console.log(`   Transaction Hash: ${tx.hash}`);
        console.log(`   Block Number: ${receipt.blockNumber}`);
        console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
        
        return tx.hash;
      } else {
        throw new Error('Withdrawal transaction failed');
      }
    } catch (error: any) {
      console.error(`❌ Error withdrawing from escrow:`, error.message);
      throw error;
    }
  }

  async cancelRealEscrow(escrowAddress: string): Promise<string> {
    try {
      console.log(`❌ Cancelling real EVM escrow...`);
      console.log(`   Escrow Address: ${escrowAddress}`);

      const escrowContract = new Contract(escrowAddress, REAL_ESCROW_ABI, this.wallet.signer);

      // Estimate gas
      const gasEstimate = await escrowContract.cancel.estimateGas();
      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);

      // Cancel
      const tx = await escrowContract.cancel({
        gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
      });

      console.log(`📡 Cancellation transaction submitted: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);

      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log(`✅ Escrow cancelled successfully!`);
        console.log(`   Transaction Hash: ${tx.hash}`);
        console.log(`   Block Number: ${receipt.blockNumber}`);
        console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
        
        return tx.hash;
      } else {
        throw new Error('Cancellation transaction failed');
      }
    } catch (error: any) {
      console.error(`❌ Error cancelling escrow:`, error.message);
      throw error;
    }
  }

  async getRealEscrowInfo(escrowAddress: string) {
    try {
      const escrowContract = new Contract(escrowAddress, REAL_ESCROW_ABI, this.wallet.signer);

      const info = {
        orderHash: await escrowContract.getOrderHash(),
        hashLock: await escrowContract.getHashLock(),
        maker: await escrowContract.getMaker(),
        taker: await escrowContract.getTaker(),
        amount: await escrowContract.getAmount(),
        timelock: await escrowContract.getTimelock(),
        isWithdrawn: await escrowContract.isWithdrawn(),
        isCancelled: await escrowContract.isCancelled()
      };

      console.log(`📋 Escrow Info for ${escrowAddress}:`);
      console.log(`   Order Hash: ${info.orderHash}`);
      console.log(`   Hash Lock: ${info.hashLock}`);
      console.log(`   Maker: ${info.maker}`);
      console.log(`   Taker: ${info.taker}`);
      console.log(`   Amount: ${ethers.formatEther(info.amount)} ETH`);
      console.log(`   Timelock: ${new Date(Number(info.timelock) * 1000).toISOString()}`);
      console.log(`   Is Withdrawn: ${info.isWithdrawn}`);
      console.log(`   Is Cancelled: ${info.isCancelled}`);

      return info;
    } catch (error: any) {
      console.error(`❌ Error getting escrow info:`, error.message);
      throw error;
    }
  }

  async waitForTransaction(txHash: string, confirmations: number = 1): Promise<any> {
    try {
      console.log(`⏳ Waiting for transaction confirmation: ${txHash}`);
      const receipt = await this.provider.waitForTransaction(txHash, confirmations);
      if (receipt) {
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      }
      return receipt;
    } catch (error: any) {
      console.error(`❌ Error waiting for transaction:`, error.message);
      throw error;
    }
  }
}
