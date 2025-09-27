import { ethers, Wallet, JsonRpcProvider, Contract } from 'ethers';
import { EvmWallet } from '../types';
import { WETH_ABI, ERC20_ABI, PYUSD_ABI } from './contracts';

export class EvmWalletManager {
  private wallet: EvmWallet;
  private provider: JsonRpcProvider;

  constructor(privateKey: string, rpcUrl: string) {
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
  }

  getWallet(): EvmWallet {
    return this.wallet;
  }

  async getBalance(tokenAddress?: string): Promise<bigint> {
    if (tokenAddress) {
      const contract = new Contract(tokenAddress, ERC20_ABI, this.wallet.signer);
      return await contract.balanceOf(this.wallet.address);
    } else {
      return await this.provider.getBalance(this.wallet.address);
    }
  }

  async depositWETH(amount: bigint, wethAddress: string): Promise<string> {
    const wethContract = new Contract(wethAddress, WETH_ABI, this.wallet.signer);
    const tx = await wethContract.deposit({ value: amount });
    await tx.wait();
    return tx.hash;
  }

  async approveToken(tokenAddress: string, spender: string, amount: bigint): Promise<string> {
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, this.wallet.signer);
    const tx = await tokenContract.approve(spender, amount);
    await tx.wait();
    return tx.hash;
  }

  async createEscrow(
    escrowFactoryAddress: string,
    maker: string,
    taker: string,
    amount: bigint,
    orderHash: string,
    hashLock: string,
    timelock: bigint
  ): Promise<string> {
    const factoryContract = new Contract(escrowFactoryAddress, [
      "function createEscrow(address maker, address taker, uint256 amount, bytes32 orderHash, bytes32 hashLock, uint256 timelock) external returns (address)"
    ], this.wallet.signer);

    const tx = await factoryContract.createEscrow(
      maker,
      taker,
      amount,
      orderHash,
      hashLock,
      timelock
    );
    await tx.wait();
    return tx.hash;
  }

  async withdrawFromEscrow(
    escrowAddress: string,
    secret: string
  ): Promise<string> {
    const escrowContract = new Contract(escrowAddress, [
      "function withdraw(bytes32 secret) external"
    ], this.wallet.signer);

    const tx = await escrowContract.withdraw(secret);
    await tx.wait();
    return tx.hash;
  }

  async cancelEscrow(escrowAddress: string): Promise<string> {
    const escrowContract = new Contract(escrowAddress, [
      "function cancel() external"
    ], this.wallet.signer);

    const tx = await escrowContract.cancel();
    await tx.wait();
    return tx.hash;
  }

  async getEscrowInfo(escrowAddress: string) {
    const escrowContract = new Contract(escrowAddress, [
      "function getOrderHash() external view returns (bytes32)",
      "function getHashLock() external view returns (bytes32)",
      "function getMaker() external view returns (address)",
      "function getTaker() external view returns (address)",
      "function getAmount() external view returns (uint256)",
      "function getTimelock() external view returns (uint256)",
      "function isWithdrawn() external view returns (bool)",
      "function isCancelled() external view returns (bool)"
    ], this.wallet.signer);

    return {
      orderHash: await escrowContract.getOrderHash(),
      hashLock: await escrowContract.getHashLock(),
      maker: await escrowContract.getMaker(),
      taker: await escrowContract.getTaker(),
      amount: await escrowContract.getAmount(),
      timelock: await escrowContract.getTimelock(),
      isWithdrawn: await escrowContract.isWithdrawn(),
      isCancelled: await escrowContract.isCancelled()
    };
  }

  // PYUSD specific methods
  public async getPyusdBalance(pyusdAddress: string): Promise<bigint> {
    const pyusdContract = new Contract(pyusdAddress, PYUSD_ABI, this.wallet.provider);
    return pyusdContract.balanceOf(this.wallet.address);
  }

  public async transferPyusd(pyusdAddress: string, toAddress: string, amount: bigint): Promise<string> {
    const pyusdContract = new Contract(pyusdAddress, PYUSD_ABI, this.wallet.signer);
    const tx = await pyusdContract.transfer(toAddress, amount);
    await tx.wait();
    return tx.hash;
  }

  public async approvePyusd(pyusdAddress: string, spender: string, amount: bigint): Promise<string> {
    const pyusdContract = new Contract(pyusdAddress, PYUSD_ABI, this.wallet.signer);
    const tx = await pyusdContract.approve(spender, amount);
    await tx.wait();
    return tx.hash;
  }

  public async getPyusdAllowance(pyusdAddress: string, spender: string): Promise<bigint> {
    const pyusdContract = new Contract(pyusdAddress, PYUSD_ABI, this.wallet.provider);
    return pyusdContract.allowance(this.wallet.address, spender);
  }

  public async getPyusdInfo(pyusdAddress: string): Promise<{name: string, symbol: string, decimals: number}> {
    const pyusdContract = new Contract(pyusdAddress, PYUSD_ABI, this.wallet.provider);
    const [name, symbol, decimals] = await Promise.all([
      pyusdContract.name(),
      pyusdContract.symbol(),
      pyusdContract.decimals()
    ]);
    return { name, symbol, decimals };
  }
}
