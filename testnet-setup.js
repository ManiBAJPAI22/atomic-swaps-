#!/usr/bin/env node

/**
 * Testnet Setup Helper
 * 
 * This script helps you get testnet funds for demonstration purposes.
 * It's completely safe as it only uses testnet networks.
 */

const { ethers } = require('ethers');
const bitcoin = require('bitcoinjs-lib');
const { ECPairFactory } = require('ecpair');
const ecc = require('@bitcoinerlab/secp256k1');

const ECPair = ECPairFactory(ecc);

// Testnet faucet URLs
const FAUCETS = {
  sepolia: [
    'https://sepoliafaucet.com/',
    'https://faucet.sepolia.dev/',
    'https://sepolia-faucet.pk910.de/',
    'https://www.alchemy.com/faucets/ethereum-sepolia'
  ],
  testnet3: [
    'https://testnet-faucet.mempool.co/',
    'https://bitcoinfaucet.uo1.net/',
    'https://testnet.help/en/btcfaucet/testnet'
  ]
};

function generateTestnetWallets() {
  console.log('🔑 Generating testnet wallets...\n');
  
  // Generate EVM wallet
  const evmWallet = ethers.Wallet.createRandom();
  console.log('📱 EVM Wallet (Sepolia):');
  console.log(`   Address: ${evmWallet.address}`);
  console.log(`   Private Key: ${evmWallet.privateKey}`);
  console.log(`   Mnemonic: ${evmWallet.mnemonic.phrase}\n`);
  
  // Generate BTC wallet
  const btcKeyPair = ECPair.makeRandom({ network: bitcoin.networks.testnet });
  const btcAddress = bitcoin.payments.p2wpkh({ 
    pubkey: btcKeyPair.publicKey, 
    network: bitcoin.networks.testnet 
  }).address;
  
  console.log('₿ BTC Wallet (Testnet3):');
  console.log(`   Address: ${btcAddress}`);
  console.log(`   Private Key (WIF): ${btcKeyPair.toWIF()}`);
  console.log(`   Private Key (Hex): ${btcKeyPair.privateKey.toString('hex')}\n`);
  
  return {
    evm: {
      address: evmWallet.address,
      privateKey: evmWallet.privateKey,
      mnemonic: evmWallet.mnemonic.phrase
    },
    btc: {
      address: btcAddress,
      privateKey: btcKeyPair.toWIF(),
      privateKeyHex: btcKeyPair.privateKey.toString('hex')
    }
  };
}

function showFaucetInstructions(wallets) {
  console.log('🚰 Testnet Faucet Instructions:\n');
  
  console.log('📱 For EVM Sepolia ETH:');
  console.log(`   Address: ${wallets.evm.address}`);
  console.log('   Faucets:');
  FAUCETS.sepolia.forEach((faucet, i) => {
    console.log(`   ${i + 1}. ${faucet}`);
  });
  console.log('   💡 Request 0.1-0.5 ETH for testing\n');
  
  console.log('₿ For BTC Testnet3:');
  console.log(`   Address: ${wallets.btc.address}`);
  console.log('   Faucets:');
  FAUCETS.testnet3.forEach((faucet, i) => {
    console.log(`   ${i + 1}. ${faucet}`);
  });
  console.log('   💡 Request 0.01-0.1 BTC for testing\n');
}

function showDemoCommand(wallets) {
  console.log('🎯 Demo Command (Real Testnet):\n');
  console.log('npx ts-node src/index.ts evm-to-btc \\');
  console.log(`  --evm-key "${wallets.evm.privateKey}" \\`);
  console.log(`  --btc-key "${wallets.btc.privateKey}" \\`);
  console.log('  --amount "1000000000000000" \\');
  console.log('  --evm-rpc "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY" \\');
  console.log('  --btc-rpc "https://mempool.space/testnet/api"\n');
  
  console.log('🔍 Check transactions on:');
  console.log(`   EVM: https://sepolia.etherscan.io/address/${wallets.evm.address}`);
  console.log(`   BTC: https://mempool.space/testnet/address/${wallets.btc.address}\n`);
}

function showSafetyWarnings() {
  console.log('⚠️  SAFETY WARNINGS:\n');
  console.log('✅ This uses ONLY testnet networks (Sepolia & Testnet3)');
  console.log('✅ No real money is involved');
  console.log('✅ All transactions are on test networks');
  console.log('✅ You can safely share these addresses\n');
  
  console.log('🚫 NEVER use testnet private keys on mainnet');
  console.log('🚫 NEVER send real funds to testnet addresses');
  console.log('🚫 NEVER use mainnet private keys in this demo\n');
}

async function main() {
  console.log('🎭 Atomic Swap CLI - Testnet Setup Helper\n');
  console.log('This tool helps you set up testnet wallets for safe demonstration.\n');
  
  showSafetyWarnings();
  
  const wallets = generateTestnetWallets();
  showFaucetInstructions(wallets);
  showDemoCommand(wallets);
  
  console.log('🎉 Setup complete! Use the demo command above to test real on-chain swaps.');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateTestnetWallets, showFaucetInstructions };
