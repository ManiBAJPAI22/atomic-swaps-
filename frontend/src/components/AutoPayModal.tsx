import React, { useState, useEffect } from 'react';
import { X, Calculator, Clock, DollarSign, User, Settings } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';

interface AutoPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetup: (config: any) => void;
}

const AutoPayModal: React.FC<AutoPayModalProps> = ({ isOpen, onClose, onSetup }) => {
  const { wallet } = useAppStore();
  const [config, setConfig] = useState({
    merchantAddress: '',
    paymentAmount: '0.1',
    paymentInterval: 15, // minutes
    totalDuration: 60, // minutes
  });
  const [calculated, setCalculated] = useState({
    totalPayments: 0,
    totalCost: '0',
  });

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setConfig({
        merchantAddress: '',
        paymentAmount: '0.1',
        paymentInterval: 15,
        totalDuration: 60,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    // Calculate total payments and cost
    const totalPayments = Math.floor(config.totalDuration / config.paymentInterval);
    const totalCost = (parseFloat(config.paymentAmount) * totalPayments).toFixed(2);
    
    setCalculated({
      totalPayments,
      totalCost,
    });
  }, [config]);

  const handleInputChange = (field: string, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!config.merchantAddress) {
      toast.error('Please enter merchant address');
      return false;
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(config.merchantAddress)) {
      toast.error('Please enter a valid Ethereum address');
      return false;
    }
    
    if (parseFloat(config.paymentAmount) <= 0) {
      toast.error('Payment amount must be greater than 0');
      return false;
    }
    
    if (config.paymentInterval <= 0) {
      toast.error('Payment interval must be greater than 0');
      return false;
    }
    
    if (config.totalDuration <= 0) {
      toast.error('Total duration must be greater than 0');
      return false;
    }
    
    if (config.totalDuration < config.paymentInterval) {
      toast.error('Total duration must be greater than payment interval');
      return false;
    }
    
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const finalConfig = {
      ...config,
      totalPayments: calculated.totalPayments,
      totalCost: calculated.totalCost,
    };
    
    onSetup(finalConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Setup AutoPay</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Merchant Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Merchant Address
            </label>
            <input
              type="text"
              value={config.merchantAddress}
              onChange={(e) => handleInputChange('merchantAddress', e.target.value)}
              placeholder="0x..."
              className="input-field font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              The address that will receive PYUSD payments
            </p>
          </div>

          {/* Payment Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Payment Amount (PYUSD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={config.paymentAmount}
                onChange={(e) => handleInputChange('paymentAmount', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Payment Interval (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={config.paymentInterval}
                onChange={(e) => handleInputChange('paymentInterval', parseInt(e.target.value))}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Total Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              value={config.totalDuration}
              onChange={(e) => handleInputChange('totalDuration', parseInt(e.target.value))}
              className="input-field"
            />
          </div>

          {/* Calculation Summary */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">Payment Summary</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Total Payments:</span>
                <span className="ml-2 font-medium text-blue-900">{calculated.totalPayments}</span>
              </div>
              <div>
                <span className="text-blue-700">Total Cost:</span>
                <span className="ml-2 font-medium text-blue-900">{calculated.totalCost} PYUSD</span>
              </div>
              <div>
                <span className="text-blue-700">Payment Every:</span>
                <span className="ml-2 font-medium text-blue-900">{config.paymentInterval} minutes</span>
              </div>
              <div>
                <span className="text-blue-700">Duration:</span>
                <span className="ml-2 font-medium text-blue-900">{config.totalDuration} minutes</span>
              </div>
            </div>
          </div>

          {/* Current Balance Check */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Current Balance</h4>
            <p className="text-sm text-gray-600">
              Your wallet: <span className="font-mono">{wallet.address}</span>
            </p>
            <p className="text-sm text-gray-600">
              ETH Balance: <span className="font-medium">{wallet.balance} ETH</span>
            </p>
            <p className="text-sm text-gray-600">
              Required PYUSD: <span className="font-medium">{calculated.totalCost} PYUSD</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Setup AutoPay
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoPayModal;
