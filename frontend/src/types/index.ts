export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  chainId: number | null;
}

export interface SwapState {
  phase: 'idle' | 'htlc-created' | 'htlc-funded' | 'escrow-deployed' | 'pyusd-sent' | 'completed' | 'failed';
  htlcAddress: string | null;
  htlcScript: string | null;
  secret: string | null;
  hashLock: string | null;
  btcAddress: string | null;
  makerAddress: string | null;
  pyusdAmount: string;
  btcAmount: string;
  txHashes: {
    btc?: string;
    evm?: string;
  };
  error: string | null;
}

export interface AutoPayConfig {
  merchantAddress: string;
  paymentAmount: string;
  paymentInterval: number; // in minutes
  totalDuration: number; // in hours
  totalPayments: number;
  totalCost: string; // in PYUSD
}

export interface AutoPayState {
  isActive: boolean;
  isPaused: boolean;
  contractAddress: string | null;
  config: AutoPayConfig | null;
  remainingBalance: string;
  totalPaid: string;
  nextPaymentTime: string | null;
  paymentHistory: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  amount: string;
  timestamp: string;
  txHash: string;
  merchantAddress: string;
}

export interface AppState {
  wallet: WalletState;
  swap: SwapState;
  autopay: AutoPayState;
  isLoading: boolean;
  error: string | null;
  
  // Wallet actions
  setWallet: (wallet: Partial<WalletState>) => void;
  connectWallet: () => Promise<void>;
  
  // Swap actions
  setSwap: (swap: Partial<SwapState>) => void;
  startSwap: (btcAddress: string) => Promise<void>;
  checkHtlcFunding: () => Promise<void>;
  executeSwap: () => Promise<void>;
  
  // AutoPay actions
  setAutoPay: (autopay: Partial<AutoPayState>) => void;
  setupAutoPay: (config: any) => Promise<void>;
  stopAutoPay: () => Promise<void>;
  
  // Utility actions
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export interface ContractConfig {
  escrowAddress: string;
  pyusdAddress: string;
  rpcUrl: string;
  chainId: number;
}
