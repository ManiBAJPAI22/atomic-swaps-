"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvmWalletManager = void 0;
const ethers_1 = require("ethers");
const contracts_1 = require("./contracts");
class EvmWalletManager {
    constructor(privateKey, rpcUrl) {
        this.provider = new ethers_1.JsonRpcProvider(rpcUrl, {
            name: 'sepolia',
            chainId: 11155111
        });
        const wallet = new ethers_1.Wallet(privateKey, this.provider);
        this.wallet = {
            address: wallet.address,
            privateKey,
            provider: this.provider,
            signer: wallet
        };
    }
    getWallet() {
        return this.wallet;
    }
    async getBalance(tokenAddress) {
        if (tokenAddress) {
            const contract = new ethers_1.Contract(tokenAddress, contracts_1.ERC20_ABI, this.wallet.signer);
            return await contract.balanceOf(this.wallet.address);
        }
        else {
            return await this.provider.getBalance(this.wallet.address);
        }
    }
    async depositWETH(amount, wethAddress) {
        const wethContract = new ethers_1.Contract(wethAddress, contracts_1.WETH_ABI, this.wallet.signer);
        const tx = await wethContract.deposit({ value: amount });
        await tx.wait();
        return tx.hash;
    }
    async approveToken(tokenAddress, spender, amount) {
        const tokenContract = new ethers_1.Contract(tokenAddress, contracts_1.ERC20_ABI, this.wallet.signer);
        const tx = await tokenContract.approve(spender, amount);
        await tx.wait();
        return tx.hash;
    }
    async createEscrow(escrowFactoryAddress, maker, taker, amount, orderHash, hashLock, timelock) {
        const factoryContract = new ethers_1.Contract(escrowFactoryAddress, [
            "function createEscrow(address maker, address taker, uint256 amount, bytes32 orderHash, bytes32 hashLock, uint256 timelock) external returns (address)"
        ], this.wallet.signer);
        const tx = await factoryContract.createEscrow(maker, taker, amount, orderHash, hashLock, timelock);
        await tx.wait();
        return tx.hash;
    }
    async withdrawFromEscrow(escrowAddress, secret) {
        const escrowContract = new ethers_1.Contract(escrowAddress, [
            "function withdraw(bytes32 secret) external"
        ], this.wallet.signer);
        const tx = await escrowContract.withdraw(secret);
        await tx.wait();
        return tx.hash;
    }
    async cancelEscrow(escrowAddress) {
        const escrowContract = new ethers_1.Contract(escrowAddress, [
            "function cancel() external"
        ], this.wallet.signer);
        const tx = await escrowContract.cancel();
        await tx.wait();
        return tx.hash;
    }
    async getEscrowInfo(escrowAddress) {
        const escrowContract = new ethers_1.Contract(escrowAddress, [
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
    async getPyusdBalance(pyusdAddress) {
        const pyusdContract = new ethers_1.Contract(pyusdAddress, contracts_1.PYUSD_ABI, this.wallet.provider);
        return pyusdContract.balanceOf(this.wallet.address);
    }
    async transferPyusd(pyusdAddress, toAddress, amount) {
        const pyusdContract = new ethers_1.Contract(pyusdAddress, contracts_1.PYUSD_ABI, this.wallet.signer);
        const tx = await pyusdContract.transfer(toAddress, amount);
        await tx.wait();
        return tx.hash;
    }
    async approvePyusd(pyusdAddress, spender, amount) {
        const pyusdContract = new ethers_1.Contract(pyusdAddress, contracts_1.PYUSD_ABI, this.wallet.signer);
        const tx = await pyusdContract.approve(spender, amount);
        await tx.wait();
        return tx.hash;
    }
    async getPyusdAllowance(pyusdAddress, spender) {
        const pyusdContract = new ethers_1.Contract(pyusdAddress, contracts_1.PYUSD_ABI, this.wallet.provider);
        return pyusdContract.allowance(this.wallet.address, spender);
    }
    async getPyusdInfo(pyusdAddress) {
        const pyusdContract = new ethers_1.Contract(pyusdAddress, contracts_1.PYUSD_ABI, this.wallet.provider);
        const [name, symbol, decimals] = await Promise.all([
            pyusdContract.name(),
            pyusdContract.symbol(),
            pyusdContract.decimals()
        ]);
        return { name, symbol, decimals };
    }
}
exports.EvmWalletManager = EvmWalletManager;
//# sourceMappingURL=wallet.js.map