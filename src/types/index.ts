export interface SwapConfig {
  evmPrivateKey: string;
  btcPrivateKey: string;
  evmRpcUrl: string;
  btcRpcUrl: string;
  amount: string;
  evmTokenAddress?: string;
}

export interface SwapOrder {
  orderHash: string;
  secret: Buffer;
  hashLock: {
    keccak256: string;
    sha256: Buffer;
  };
  srcChainId: number;
  dstChainId: number;
  makingAmount: bigint;
  takingAmount: bigint;
}

export interface BtcWallet {
  keyPair: any;
  publicKey: Buffer;
  address: string;
  privateKey: string;
}

export interface EvmWallet {
  address: string;
  privateKey: string;
  provider: any;
  signer: any;
}

export interface SwapStatus {
  phase: 'created' | 'funded' | 'claimed' | 'completed' | 'failed';
  message: string;
  txHashes?: {
    evm?: string;
    btc?: string;
  };
}
