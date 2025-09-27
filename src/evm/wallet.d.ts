import { EvmWallet } from '../types';
export declare class EvmWalletManager {
    private wallet;
    private provider;
    constructor(privateKey: string, rpcUrl: string);
    getWallet(): EvmWallet;
    getBalance(tokenAddress?: string): Promise<bigint>;
    depositWETH(amount: bigint, wethAddress: string): Promise<string>;
    approveToken(tokenAddress: string, spender: string, amount: bigint): Promise<string>;
    createEscrow(escrowFactoryAddress: string, maker: string, taker: string, amount: bigint, orderHash: string, hashLock: string, timelock: bigint): Promise<string>;
    withdrawFromEscrow(escrowAddress: string, secret: string): Promise<string>;
    cancelEscrow(escrowAddress: string): Promise<string>;
    getEscrowInfo(escrowAddress: string): Promise<{
        orderHash: any;
        hashLock: any;
        maker: any;
        taker: any;
        amount: any;
        timelock: any;
        isWithdrawn: any;
        isCancelled: any;
    }>;
    getPyusdBalance(pyusdAddress: string): Promise<bigint>;
    transferPyusd(pyusdAddress: string, toAddress: string, amount: bigint): Promise<string>;
    approvePyusd(pyusdAddress: string, spender: string, amount: bigint): Promise<string>;
    getPyusdAllowance(pyusdAddress: string, spender: string): Promise<bigint>;
    getPyusdInfo(pyusdAddress: string): Promise<{
        name: string;
        symbol: string;
        decimals: number;
    }>;
}
//# sourceMappingURL=wallet.d.ts.map