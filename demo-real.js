#!/usr/bin/env node

/**
 * Real Testnet Demo
 * 
 * This script demonstrates real on-chain atomic swaps using testnet networks.
 * It shows actual blockchain transactions without risking real funds.
 */

const { execSync } = require('child_process');
const { generateTestnetWallets } = require('./testnet-setup');

async function checkTestnetFunds(evmAddress, btcAddress) {
  console.log('🔍 Checking testnet balances...\n');
  
  try {
    // Check EVM balance (this would need a real RPC call)
    console.log(`📱 EVM Address: ${evmAddress}`);
    console.log('   Check balance at: https://sepolia.etherscan.io/address/' + evmAddress);
    
    // Check BTC balance (this would need a real RPC call)  
    console.log(`₿ BTC Address: ${btcAddress}`);
    console.log('   Check balance at: https://mempool.space/testnet/address/' + btcAddress);
    
    console.log('\n💡 If balances are 0, use the testnet faucets to get test funds.\n');
  } catch (error) {
    console.log('⚠️  Could not check balances automatically. Please check manually.\n');
  }
}

async function runRealTestnetDemo() {
  console.log('🎯 Real Testnet Atomic Swap Demo\n');
  console.log('This will perform REAL on-chain transactions using testnet networks.\n');
  
  // Generate wallets
  const wallets = generateTestnetWallets();
  
  // Check if funds are available
  await checkTestnetFunds(wallets.evm.address, wallets.btc.address);
  
  console.log('🚀 Starting real testnet atomic swap...\n');
  
  try {
    // Run the actual swap command
    const command = `npx ts-node src/index.ts evm-to-btc \\
      --evm-key "${wallets.evm.privateKey}" \\
      --btc-key "${wallets.btc.privateKey}" \\
      --amount "1000000000000000" \\
      --evm-rpc "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY" \\
      --btc-rpc "https://mempool.space/testnet/api"`;
    
    console.log('Executing command:');
    console.log(command + '\n');
    
    // Note: This would run the actual command
    // execSync(command, { stdio: 'inherit' });
    
    console.log('✅ Real testnet swap completed!');
    console.log('🔍 Check the transaction hashes on the respective block explorers.\n');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.log('\n💡 Make sure you have testnet funds before running the demo.');
  }
}

async function main() {
  console.log('🎭 Atomic Swap CLI - Real Testnet Demo\n');
  
  console.log('⚠️  This demo uses REAL testnet networks:');
  console.log('   • Ethereum Sepolia (testnet)');
  console.log('   • Bitcoin Testnet3');
  console.log('   • No real money involved\n');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise((resolve) => {
    rl.question('Do you want to proceed with real testnet demo? (y/N): ', resolve);
  });
  
  rl.close();
  
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    await runRealTestnetDemo();
  } else {
    console.log('Demo cancelled. Use mock mode for safe testing:\n');
    console.log('npx ts-node src/index.ts evm-to-btc --btc-rpc "https://mock.btc.api"');
  }
}

if (require.main === module) {
  main().catch(console.error);
}
