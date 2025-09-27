import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import WalletConnection from './components/WalletConnection';
import AtomicSwap from './components/AtomicSwap';
import AutoPayModal from './components/AutoPayModal';
import AutoPayDashboard from './components/AutoPayDashboard';
import { useAppStore } from './store/useAppStore';

function App() {
  const { swap, setupAutoPay } = useAppStore();
  const [btcAddress, setBtcAddress] = useState('');
  const [showAutoPayModal, setShowAutoPayModal] = useState(false);

  const handleAutoPaySetup = async (config: any) => {
    try {
      await setupAutoPay(config);
      setShowAutoPayModal(false);
    } catch (error: any) {
      console.error('AutoPay setup failed:', error);
    }
  };

  const canSetupAutoPay = swap.phase === 'completed' || swap.phase === 'pyusd-sent';

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-bitcoin-500 to-ethereum-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AS</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Atomic Swap</h1>
            </div>
            <div className="text-sm text-gray-500">
              BTC ↔ PYUSD with AutoPay
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Page Title */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bitcoin to PYUSD Atomic Swap
            </h1>
            <p className="text-lg text-gray-600">
              Trustless cross-chain exchange with automated recurring payments
            </p>
          </div>

          {/* Wallet Connection */}
          <WalletConnection
            btcAddress={btcAddress}
            onBtcAddressChange={setBtcAddress}
          />

          {/* Atomic Swap */}
          <AtomicSwap />

          {/* AutoPay Setup Button */}
          {canSetupAutoPay && (
            <div className="text-center">
              <button
                onClick={() => setShowAutoPayModal(true)}
                className="btn-primary text-lg px-8 py-3 flex items-center gap-2 mx-auto"
              >
                <span>🚀</span>
                Setup AutoPay
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Set up recurring PYUSD payments to any merchant address
              </p>
            </div>
          )}

          {/* AutoPay Dashboard */}
          <AutoPayDashboard />

          {/* AutoPay Modal */}
          <AutoPayModal
            isOpen={showAutoPayModal}
            onClose={() => setShowAutoPayModal(false)}
            onSetup={handleAutoPaySetup}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>Built with React, TypeScript, and Tailwind CSS</p>
            <p className="mt-1">
              Powered by Ethereum Sepolia Testnet and Bitcoin Testnet3
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;