export interface UTXO {
    txid: string;
    vout: number;
    value: number;
}
export declare class BtcProvider {
    private api;
    private network;
    private mockMode;
    constructor(apiBase: string, network?: string, mockMode?: boolean);
    isMockMode(): boolean;
    private delay;
    getUtxos(address: string): Promise<UTXO[]>;
    getBalance(address: string): Promise<number>;
    broadcastTx(txHex: string): Promise<string>;
    waitForTxConfirmation(txid: string, timeoutMs?: number): Promise<{
        confirmedAt: string;
        blockHeight: number;
    }>;
    waitForUtxo(address: string, timeoutMs?: number): Promise<UTXO[]>;
    getUtxosFromTxid(txid: string): Promise<UTXO[]>;
    getRawTransactionHex(txid: string): Promise<string>;
    verifyHTLCScriptHashFromTx(txid: string, htlcScript: Buffer): Promise<void>;
}
//# sourceMappingURL=provider.d.ts.map