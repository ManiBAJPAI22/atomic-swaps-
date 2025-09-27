import * as bitcoin from 'bitcoinjs-lib';
import { ECPairInterface } from 'ecpair';
export declare function addressToEthAddressFormat(btcAddress: string): string;
export declare function publicKeyToAddress(publicKey: Buffer | string, network: bitcoin.Network): string;
export declare function walletFromPrivateKey(privateKey: string, network: bitcoin.Network): {
    keyPair: ECPairInterface;
    publicKey: Buffer;
    address: string;
};
export declare function createSrcHtlcScript(orderHashHex: string, hashLockSha256: Buffer, privateWithdrawal: number | bigint, privateCancellation: number | bigint, btcUserPublicKey: Buffer, btcResolverPublicKey: Buffer, lockTillPrivateWithdrawal?: boolean): Buffer;
export declare function createHtlcWithRecipientAddress(orderHashHex: string, hashLockSha256: Buffer, privateWithdrawal: number | bigint, privateCancellation: number | bigint, recipientAddress: string, // Your specific address: tb1qpfrsr2k3t928vpuvrz0l4vdl3yyvpgwxleugmp
btcUserPublicKey: Buffer, network?: bitcoin.Network): Buffer;
export declare function createDstHtlcScript(orderHashHex: string, hashLockSha256: Buffer, privateWithdrawal: number | bigint, privateCancellation: number | bigint, btcUserPublicKey: Buffer, btcResolverPublicKey: Buffer, lockTillPrivateWithdrawal?: boolean): Buffer;
//# sourceMappingURL=htlc.d.ts.map