# Real Atomic Swap Implementation

This document describes how to use the **real** atomic swap implementation that interacts with actual blockchains instead of mock mode.

## 🚀 Real Implementation Features

### ✅ **Real Blockchain Integration**
- **EVM Side**: Real Sepolia testnet with actual smart contracts
- **BTC Side**: Real Bitcoin testnet with actual UTXOs and transactions
- **Real Transactions**: All transactions are broadcast to real networks
- **Real Confirmations**: Waits for actual blockchain confirmations

### ✅ **Real Smart Contracts**
- Deployable Solidity escrow contract
- Real gas estimation and transaction fees
- Real contract state management
- Real event logging

### ✅ **Real Bitcoin Operations**
- Real UTXO fetching from Blockstream API
- Real transaction broadcasting
- Real transaction confirmation waiting
- Real balance checking

## 📋 Prerequisites

### 1. **Testnet Funds**
You need testnet funds for both networks:

#### **EVM Sepolia Testnet**
- Get Sepolia ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
- Minimum: 0.01 ETH for gas fees

#### **Bitcoin Testnet**
- Get testnet BTC from [Bitcoin Testnet Faucet](https://testnet-faucet.mempool.co/)
- Fund the resolver address: `tb1qc8whyxx6x637j6328weljzw4clgq9sffcu5c43`
- Minimum: 0.001 BTC for the resolver

### 2. **Deploy Escrow Contract**
Deploy the `RealEscrow.sol` contract on Sepolia testnet and get the contract address.

## 🛠️ Setup Instructions

### 1. **Build the Project**
```bash
npm run build
```

### 2. **Check Your Balances**
```bash
npm run real check-balances --evm-key "YOUR_EVM_PRIVATE_KEY" --btc-key "YOUR_BTC_PRIVATE_KEY"
```

### 3. **Deploy Escrow Contract** (One-time setup)
```bash
npm run real deploy-escrow --evm-key "YOUR_EVM_PRIVATE_KEY"
```

## 🚀 Usage

### **Real EVM to BTC Swap**
```bash
npm run real real-evm-to-btc \
  --evm-key "YOUR_EVM_PRIVATE_KEY" \
  --btc-key "YOUR_BTC_PRIVATE_KEY" \
  --amount "10000000000000000" \
  --escrow-contract "0x_CONTRACT_ADDRESS"
```

### **Command Options**
- `--evm-key`: Your EVM private key (required)
- `--btc-key`: Your BTC private key (required)  
- `--amount`: Amount in wei (required)
- `--evm-rpc`: EVM RPC URL (default: https://sepolia.drpc.org)
- `--btc-rpc`: BTC RPC URL (default: https://blockstream.info/testnet/api)
- `--escrow-contract`: Deployed escrow contract address (required)

## 📊 Real vs Mock Comparison

| Feature | Mock Implementation | Real Implementation |
|---------|-------------------|-------------------|
| **EVM Network** | Real connection, mock contracts | Real connection, real contracts |
| **Bitcoin Network** | Mock UTXOs, mock transactions | Real UTXOs, real transactions |
| **Transaction Broadcasting** | Mock responses | Real blockchain broadcasting |
| **Confirmations** | Simulated | Real blockchain confirmations |
| **Gas Fees** | Not applicable | Real gas estimation and payment |
| **Testnet Funds** | Not required | Required for both networks |
| **Contract Deployment** | Not required | Required (one-time) |

## ⚠️ Important Notes

### **Real Money (Testnet)**
- This uses **real testnet funds** - not mainnet
- Testnet funds have no real value
- Always use testnet for development

### **Gas Fees**
- Real EVM transactions require gas fees
- Gas is paid in Sepolia ETH
- Gas estimation is automatic

### **Transaction Times**
- Real confirmations take time (1-10 minutes)
- Bitcoin confirmations are slower than EVM
- Network congestion can cause delays

### **Error Handling**
- Real networks can have temporary issues
- Transaction failures cost gas fees
- Always check balances before swapping

## 🔧 Troubleshooting

### **"Insufficient funds" Error**
- Check your EVM balance: `npm run real check-balances`
- Fund your wallet with testnet ETH

### **"No UTXOs available for resolver" Error**
- Fund the resolver address with testnet BTC
- Resolver address: `tb1qc8whyxx6x637j6328weljzw4clgq9sffcu5c43`

### **"Transaction failed" Error**
- Check gas prices and network congestion
- Ensure sufficient ETH for gas fees
- Try again after a few minutes

### **"Contract not found" Error**
- Deploy the escrow contract first
- Use the correct contract address
- Ensure contract is deployed on Sepolia

## 🎯 Next Steps

1. **Deploy the escrow contract** on Sepolia testnet
2. **Fund both wallets** with testnet tokens
3. **Run a real swap** to test the implementation
4. **Monitor transactions** on block explorers
5. **Scale up** for production use

## 🔗 Useful Links

- [Sepolia Testnet Faucet](https://sepoliafaucet.com/)
- [Bitcoin Testnet Faucet](https://testnet-faucet.mempool.co/)
- [Sepolia Block Explorer](https://sepolia.etherscan.io/)
- [Bitcoin Testnet Explorer](https://blockstream.info/testnet/)
- [Blockstream API Docs](https://blockstream.info/api/)

---

**Ready to go live with real atomic swaps!** 🚀
