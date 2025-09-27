import React, { useState } from 'react';
import { Wallet, Copy, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';

interface WalletConnectionProps {
  onBtcAddressChange: (address: string) => void;
  btcAddress: string;
}

const WalletConnection: React.FC<WalletConnectionProps> = ({ onBtcAddressChange, btcAddress }) => {
  const { wallet, connectWallet, isLoading } = useAppStore();
  const [copied, setCopied] = useState(false);

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast.success('Wallet connected successfully!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const validateBtcAddress = (address: string): boolean => {
    // Basic Bitcoin address validation
    const btcRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$|^tb1[a-z0-9]{39,59}$/;
    return btcRegex.test(address);
  };

  const handleBtcAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    onBtcAddressChange(address);
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <Wallet className="w-6 h-6 text-primary-600" />
        <h2 className="text-xl font-semibold text-gray-900">Wallet Connection</h2>
      </div>

      {/* EVM Wallet Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Ethereum Wallet (Maker)</h3>
        
        {!wallet.isConnected ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              Connect your MetaMask wallet to receive PYUSD tokens
            </p>
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="btn-ethereum flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              {isLoading ? 'Connecting...' : 'Connect MetaMask'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-800 font-medium">Connected</span>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Your Address
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={wallet.address || ''}
                  readOnly
                  className="input-field flex-1 font-mono text-sm"
                />
                <button
                  onClick={copyAddress}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Balance:</span>
                <span className="ml-2 font-medium">{wallet.balance} ETH</span>
              </div>
              <div>
                <span className="text-gray-500">Network:</span>
                <span className="ml-2 font-medium">
                  {wallet.chainId === 11155111 ? 'Sepolia Testnet' : `Chain ${wallet.chainId}`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BTC Address Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Bitcoin Address (Taker)</h3>
        
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Your Bitcoin Address
          </label>
          <input
            type="text"
            value={btcAddress}
            onChange={handleBtcAddressChange}
            placeholder="Enter your Bitcoin testnet address (starts with tb1...)"
            className={`input-field font-mono text-sm ${
              btcAddress && !validateBtcAddress(btcAddress)
                ? 'border-red-300 focus:ring-red-500'
                : ''
            }`}
          />
          
          {btcAddress && !validateBtcAddress(btcAddress) && (
            <p className="text-sm text-red-600">
              Please enter a valid Bitcoin testnet address
            </p>
          )}
          
          {btcAddress && validateBtcAddress(btcAddress) && (
            <p className="text-sm text-green-600">
              ✓ Valid Bitcoin testnet address
            </p>
          )}

          <div className="text-sm text-gray-600">
            <p className="mb-1">You'll need to send BTC to the HTLC address from this address.</p>
            <p>Make sure you have access to this address in your Electrum wallet.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnection;
