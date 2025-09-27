export declare class AutoPayManager {
    private ownerWallet;
    private provider;
    private autopayContract;
    private pyusdContract;
    private pyusdAddress;
    constructor(rpcUrl: string, ownerPrivateKey: string, autopayAddress: string, pyusdAddress: string);
    getAutoPayInfo(): Promise<{
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
    }>;
    startAutoPay(): Promise<string>;
    executePayment(): Promise<string>;
    pauseAutoPay(): Promise<string>;
    resumeAutoPay(): Promise<string>;
    stopAutoPay(): Promise<string>;
    withdrawRemainingFunds(): Promise<string>;
    getNextPaymentTime(): Promise<bigint>;
    getTimeRemaining(): Promise<bigint>;
    checkMerchantBalance(): Promise<bigint>;
    updateBalance(): Promise<string>;
}
//# sourceMappingURL=autopay-manager.d.ts.map