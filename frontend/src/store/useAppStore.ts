import { create } from 'zustand';
import { AppState, SwapState, AutoPayState, WalletState } from '../types';

const initialSwapState: SwapState = {
  phase: 'idle',
  htlcAddress: null,
  htlcScript: null,
  secret: null,
  hashLock: null,
  btcAddress: null,
  makerAddress: null,
  pyusdAmount: '1.0',
  btcAmount: '0.0001',
  txHashes: {},
  error: null,
};

const initialAutoPayState: AutoPayState = {
  isActive: false,
  isPaused: false,
  contractAddress: null,
  config: null,
  remainingBalance: '0',
  totalPaid: '0',
  nextPaymentTime: null,
  paymentHistory: [],
};

const initialWalletState: WalletState = {
  isConnected: false,
  address: null,
  balance: '0',
  chainId: null,
};

export const useAppStore = create<AppState>((set, get) => ({
  wallet: initialWalletState,
  swap: initialSwapState,
  autopay: initialAutoPayState,
  isLoading: false,
  error: null,

  // Wallet actions
  setWallet: (wallet: Partial<WalletState>) =>
    set((state) => ({
      wallet: { ...state.wallet, ...wallet },
    })),

  connectWallet: async () => {
    set({ isLoading: true, error: null });
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        const address = accounts[0];
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        });
        const chainId = await window.ethereum.request({
          method: 'eth_chainId',
        });

        set({
          wallet: {
            isConnected: true,
            address,
            balance: (parseInt(balance, 16) / 1e18).toFixed(4),
            chainId: parseInt(chainId, 16),
          },
          isLoading: false,
        });
      } else {
        throw new Error('MetaMask not detected');
      }
    } catch (error: any) {
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },

  // Swap actions
  setSwap: (swap: Partial<SwapState>) =>
    set((state) => ({
      swap: { ...state.swap, ...swap },
    })),

  startSwap: async (btcAddress: string) => {
    set({ isLoading: true, error: null });
    try {
      // This will call the backend API to start the swap
      const response = await fetch('/api/swap/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          btcAddress,
          makerAddress: get().wallet.address,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start swap');
      }

      const data = await response.json();
      set({
        swap: {
          ...get().swap,
          phase: 'htlc-created',
          htlcAddress: data.htlcAddress,
          htlcScript: data.htlcScript,
          secret: data.secret,
          hashLock: data.hashLock,
          btcAddress,
          makerAddress: get().wallet.address,
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },

  executeSwap: async () => {
    set({ isLoading: true, error: null });
    try {
      // Get the current swap ID from the store
      const swapId = get().swap.htlcAddress ? `swap_${Date.now()}` : null;
      if (!swapId) {
        throw new Error('No active swap found');
      }

      const response = await fetch(`/api/swap/execute/${swapId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to execute swap');
      }

      const data = await response.json();
      set({
        swap: {
          ...get().swap,
          phase: 'completed',
          txHashes: {
            ...get().swap.txHashes,
            evm: data.txHash,
          },
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },

  checkHtlcFunding: async () => {
    try {
      const response = await fetch(`/api/swap/check-funding/${get().swap.htlcAddress}`);
      const data = await response.json();
      
      if (data.isFunded) {
        set((state) => ({
          swap: {
            ...state.swap,
            phase: 'htlc-funded',
          },
        }));
        
        // Automatically execute the swap after HTLC is funded
        setTimeout(async () => {
          try {
            await get().executeSwap();
          } catch (error) {
            console.error('Error executing swap:', error);
          }
        }, 2000); // Wait 2 seconds before executing
      }
    } catch (error: any) {
      console.error('Error checking HTLC funding:', error);
    }
  },

  // AutoPay actions
  setAutoPay: (autopay: Partial<AutoPayState>) =>
    set((state) => ({
      autopay: { ...state.autopay, ...autopay },
    })),

  setupAutoPay: async (config: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/autopay/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          makerAddress: get().wallet.address,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to setup AutoPay');
      }

      const data = await response.json();
      set({
        autopay: {
          ...get().autopay,
          contractAddress: data.contractAddress,
          config: data.config,
          isActive: true,
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },

  stopAutoPay: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/autopay/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: get().autopay.contractAddress,
        }),
      });

      if (response.ok) {
        set((state) => ({
          autopay: {
            ...state.autopay,
            isActive: false,
          },
          isLoading: false,
        }));
      }
    } catch (error: any) {
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },

  // Utility actions
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  reset: () => set({
    wallet: initialWalletState,
    swap: initialSwapState,
    autopay: initialAutoPayState,
    isLoading: false,
    error: null,
  }),
}));
