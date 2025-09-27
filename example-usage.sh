#!/bin/bash

# Example usage script for Atomic Swap CLI
# Make sure to replace the private keys and RPC URLs with your own

echo "🚀 Atomic Swap CLI Example Usage"
echo "================================="
echo ""

echo "📝 Prerequisites:"
echo "1. Get Sepolia ETH from: https://sepoliafaucet.com/"
echo "2. Get BTC Testnet from: https://coinfaucet.eu/en/btc-testnet/"
echo "3. Replace private keys and RPC URLs below"
echo ""

echo "🔧 Building the CLI..."
npm run build

echo ""
echo "🎯 Example Commands:"
echo ""

echo "1. Interactive Mode (Recommended):"
echo "   npm run dev interactive"
echo ""

echo "2. EVM to BTC Swap:"
echo "   npm run dev evm-to-btc \\"
echo "     --evm-key \"0xYOUR_EVM_PRIVATE_KEY\" \\"
echo "     --btc-key \"YOUR_BTC_WIF_PRIVATE_KEY\" \\"
echo "     --amount \"1000000000000000000\" \\"
echo "     --evm-rpc \"https://sepolia.infura.io/v3/YOUR_KEY\" \\"
echo "     --btc-rpc \"https://blockstream.info/testnet/api\""
echo ""

echo "3. BTC to EVM Swap:"
echo "   npm run dev btc-to-evm \\"
echo "     --evm-key \"0xYOUR_EVM_PRIVATE_KEY\" \\"
echo "     --btc-key \"YOUR_BTC_WIF_PRIVATE_KEY\" \\"
echo "     --amount \"100000\" \\"
echo "     --evm-rpc \"https://sepolia.infura.io/v3/YOUR_KEY\" \\"
echo "     --btc-rpc \"https://blockstream.info/testnet/api\""
echo ""

echo "⚠️  Important Notes:"
echo "- This is for TESTNET only (Sepolia + BTC Testnet4)"
echo "- Never use mainnet private keys"
echo "- Always test with small amounts first"
echo "- Make sure you have sufficient testnet tokens"
echo ""

echo "🔍 For help:"
echo "   npm run dev -- --help"
