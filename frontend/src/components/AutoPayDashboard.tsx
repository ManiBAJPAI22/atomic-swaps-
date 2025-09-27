import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, DollarSign, Clock, User, ExternalLink, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import toast from 'react-hot-toast';

const AutoPayDashboard: React.FC = () => {
  const { autopay, stopAutoPay, isLoading } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const handleStop = async () => {
    if (window.confirm('Are you sure you want to stop AutoPay? This action cannot be undone.')) {
      try {
        await stopAutoPay();
        toast.success('AutoPay stopped successfully');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in real app, this would fetch latest data
    setTimeout(() => {
      setRefreshing(false);
      toast.success('AutoPay status updated');
    }, 1000);
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadge = () => {
    if (!autopay.isActive) {
      return <span className="status-badge status-error">Inactive</span>;
    }
    if (autopay.isPaused) {
      return <span className="status-badge status-pending">Paused</span>;
    }
    return <span className="status-badge status-active">Active</span>;
  };

  const getNextPaymentTime = () => {
    if (!autopay.nextPaymentTime) return 'N/A';
    const nextTime = new Date(autopay.nextPaymentTime);
    const now = new Date();
    const diffMs = nextTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Now';
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (diffMinutes > 0) {
      return `${diffMinutes}m ${diffSeconds}s`;
    }
    return `${diffSeconds}s`;
  };

  if (!autopay.contractAddress) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No AutoPay Setup</h3>
          <p className="text-gray-600">
            Complete an atomic swap first, then set up AutoPay to start recurring payments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">AutoPay Dashboard</h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Status</span>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-gray-500">
            {autopay.isActive ? 'Processing payments' : 'Not running'}
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Remaining Balance</span>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {parseFloat(autopay.remainingBalance).toFixed(2)} PYUSD
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Paid</span>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {parseFloat(autopay.totalPaid).toFixed(2)} PYUSD
          </p>
        </div>
      </div>

      {/* Configuration Details */}
      {autopay.config && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">Merchant:</span>
                <span className="font-mono text-sm">{autopay.config.merchantAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">Payment Amount:</span>
                <span className="font-semibold">{autopay.config.paymentAmount} PYUSD</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">Interval:</span>
                <span className="font-semibold">{autopay.config.paymentInterval} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">Next Payment:</span>
                <span className="font-semibold">{getNextPaymentTime()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Information */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contract Information</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-600">Contract Address:</span>
            <span className="font-mono text-sm">{autopay.contractAddress}</span>
            <a
              href={`https://sepolia.etherscan.io/address/${autopay.contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-800"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Payment History */}
      {autopay.paymentHistory.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Payments</h3>
          <div className="space-y-2">
            {autopay.paymentHistory.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="font-medium">{payment.amount} PYUSD</p>
                    <p className="text-xs text-gray-500">{formatTime(payment.timestamp)}</p>
                  </div>
                </div>
                <a
                  href={`https://sepolia.etherscan.io/tx/${payment.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-800"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        {autopay.isActive && !autopay.isPaused && (
          <button
            onClick={handleStop}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            {isLoading ? 'Stopping...' : 'Stop AutoPay'}
          </button>
        )}
        
        {autopay.isPaused && (
          <button
            onClick={() => toast('Resume functionality coming soon')}
            className="btn-primary flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Resume AutoPay
          </button>
        )}
      </div>
    </div>
  );
};

export default AutoPayDashboard;
