import React, { useState, useEffect } from 'react';
import { ArrowRight, Copy, ExternalLink, Clock, CheckCircle, AlertCircle, Bitcoin, DollarSign } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

const AtomicSwap: React.FC = () => {
  const { swap, startSwap, checkHtlcFunding, isLoading } = useAppStore();
  const [btcAddress, setBtcAddress] = useState('');
  const [qrCode, setQrCode] = useState<string>('');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const generateQRCode = async (text: string) => {
    try {
      const qr = await QRCode.toDataURL(text, { width: 200 });
      setQrCode(qr);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleStartSwap = async () => {
    if (!btcAddress) {
      toast.error('Please enter your Bitcoin address');
      return;
    }
    
    try {
      await startSwap(btcAddress);
      toast.success('HTLC created successfully!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCheckFunding = async () => {
    try {
      await checkHtlcFunding();
      toast.success('HTLC funding status updated');
    } catch (error: any) {
      toast.error('Failed to check funding status');
    }
  };

  useEffect(() => {
    if (swap.htlcAddress) {
      generateQRCode(swap.htlcAddress);
    }
  }, [swap.htlcAddress]);

  const getPhaseInfo = () => {
    switch (swap.phase) {
      case 'idle':
        return { icon: Clock, text: 'Ready to start', color: 'text-gray-500' };
      case 'htlc-created':
        return { icon: AlertCircle, text: 'HTLC created - Fund with BTC', color: 'text-yellow-600' };
      case 'htlc-funded':
        return { icon: CheckCircle, text: 'HTLC funded - Processing...', color: 'text-blue-600' };
      case 'escrow-deployed':
        return { icon: CheckCircle, text: 'Escrow deployed - Sending PYUSD...', color: 'text-blue-600' };
      case 'pyusd-sent':
        return { icon: CheckCircle, text: 'PYUSD sent - Swap completed!', color: 'text-green-600' };
      case 'completed':
        return { icon: CheckCircle, text: 'Swap completed successfully!', color: 'text-green-600' };
      case 'failed':
        return { icon: AlertCircle, text: 'Swap failed', color: 'text-red-600' };
      default:
        return { icon: Clock, text: 'Unknown status', color: 'text-gray-500' };
    }
  };

  const phaseInfo = getPhaseInfo();
  const PhaseIcon = phaseInfo.icon;

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <ArrowRight className="w-6 h-6 text-primary-600" />
        <h2 className="text-xl font-semibold text-gray-900">BTC → PYUSD Atomic Swap</h2>
      </div>

      {/* Swap Status */}
      <div className="mb-6">
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <PhaseIcon className={`w-6 h-6 ${phaseInfo.color}`} />
          <div>
            <p className={`font-medium ${phaseInfo.color}`}>{phaseInfo.text}</p>
            {swap.error && (
              <p className="text-sm text-red-600 mt-1">{swap.error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Swap Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Swap Details</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Bitcoin className="w-5 h-5 text-bitcoin-500" />
                <span className="font-medium">You Send</span>
              </div>
              <span className="font-mono">{swap.btcAmount} BTC</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-ethereum-500" />
                <span className="font-medium">You Receive</span>
              </div>
              <span className="font-mono">{swap.pyusdAmount} PYUSD</span>
            </div>
          </div>
        </div>

        {/* HTLC Information */}
        {swap.htlcAddress && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">HTLC Information</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HTLC Address
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={swap.htlcAddress}
                    readOnly
                    className="input-field flex-1 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(swap.htlcAddress!, 'HTLC Address')}
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {copied === 'HTLC Address' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {qrCode && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Scan to send BTC</p>
                  <img src={qrCode} alt="HTLC QR Code" className="mx-auto border rounded-lg" />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(swap.htlcAddress!, 'HTLC Address')}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Address
                </button>
                <button
                  onClick={handleCheckFunding}
                  disabled={isLoading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Check Funding
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {swap.phase === 'idle' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Your Bitcoin Address
            </label>
            <input
              type="text"
              value={btcAddress}
              onChange={(e) => setBtcAddress(e.target.value)}
              placeholder="Enter your Bitcoin testnet address"
              className="input-field font-mono"
            />
            <button
              onClick={handleStartSwap}
              disabled={!btcAddress || isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Bitcoin className="w-4 h-4" />
              {isLoading ? 'Creating HTLC...' : 'Start Atomic Swap'}
            </button>
          </div>
        )}

        {swap.phase === 'htlc-created' && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Next Steps:</h4>
              <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                <li>Copy the HTLC address above</li>
                <li>Open your Electrum wallet</li>
                <li>Send {swap.btcAmount} BTC to the HTLC address</li>
                <li>Wait for confirmation (1-6 confirmations)</li>
                <li>Click "Check Funding" to proceed</li>
              </ol>
            </div>
          </div>
        )}

        {swap.phase === 'completed' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Swap Completed!</h4>
            <p className="text-sm text-green-700">
              You have successfully received {swap.pyusdAmount} PYUSD tokens.
            </p>
            {swap.txHashes.evm && (
              <a
                href={`https://sepolia.etherscan.io/tx/${swap.txHashes.evm}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-800 mt-2"
              >
                View Transaction <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AtomicSwap;
