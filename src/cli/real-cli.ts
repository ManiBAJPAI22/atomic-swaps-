#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { RealEvmToBtcSwap } from '../swap/real-evm-to-btc';
import { SwapConfig } from '../types';

const program = new Command();

program
  .name('real-atomic-swap')
  .description('REAL atomic swaps between EVM Sepolia and BTC Testnet4')
  .version('1.0.0');

program
  .command('real-evm-to-btc')
  .description('Real EVM to BTC atomic swap')
  .option('-e, --evm-key <key>', 'EVM private key')
  .option('-b, --btc-key <key>', 'BTC private key')
  .option('-a, --amount <amount>', 'Amount to swap (in wei)')
  .option('--evm-rpc <url>', 'EVM RPC URL', 'https://sepolia.drpc.org')
  .option('--btc-rpc <url>', 'BTC RPC URL', 'https://blockstream.info/testnet/api')
  .option('--escrow-contract <address>', 'EVM Escrow Contract Address')
  .action(async (options) => {
    try {
      console.log(chalk.blue('\n🚀 REAL Atomic Swap - EVM to BTC\n'));
      
      if (!options.escrowContract) {
        console.log(chalk.red('❌ Error: --escrow-contract address is required for real swaps'));
        console.log(chalk.yellow('💡 Deploy the RealEscrow.sol contract first and provide the address'));
        process.exit(1);
      }

      const config = await getRealSwapConfig(options, 'evm-to-btc');
      const swap = new RealEvmToBtcSwap(config, options.escrowContract);
      
      const spinner = ora('Creating real swap order...').start();
      const order = await swap.createOrder();
      spinner.succeed('Real order created');

      const executeSpinner = ora('Executing real swap...').start();
      const result = await swap.executeSwap(order);
      
      if (result.phase === 'completed') {
        executeSpinner.succeed('Real swap completed successfully!');
        console.log(chalk.green('\n🎉 Real Swap Results:'));
        console.log(chalk.blue('EVM TX:'), result.txHashes?.evm);
        console.log(chalk.blue('BTC TX:'), result.txHashes?.btc);
        console.log(chalk.green('\n✅ Your atomic swap is now live on the blockchain!'));
      } else {
        executeSpinner.fail('Real swap failed');
        console.log(chalk.red('Error:'), result.message);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('deploy-escrow')
  .description('Deploy the real escrow contract')
  .option('-e, --evm-key <key>', 'EVM private key for deployment')
  .option('--evm-rpc <url>', 'EVM RPC URL', 'https://sepolia.drpc.org')
  .action(async (options) => {
    try {
      console.log(chalk.blue('\n🏗️ Deploying Real Escrow Contract\n'));
      
      const { ethers } = await import('ethers');
      const provider = new ethers.JsonRpcProvider(options.evmRpc);
      const wallet = new ethers.Wallet(options.evmKey, provider);
      
      console.log(`📡 Deploying from: ${wallet.address}`);
      
      // Read the contract source
      const fs = await import('fs');
      const contractSource = fs.readFileSync('./src/evm/RealEscrow.sol', 'utf8');
      
      // For now, we'll just show the contract address that needs to be deployed
      console.log(chalk.yellow('⚠️  Manual deployment required:'));
      console.log('1. Copy the contract from src/evm/RealEscrow.sol');
      console.log('2. Deploy it on Sepolia testnet');
      console.log('3. Use the deployed address with --escrow-contract');
      console.log(`\nContract source location: ${process.cwd()}/src/evm/RealEscrow.sol`);
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('check-balances')
  .description('Check balances for real swap')
  .option('-e, --evm-key <key>', 'EVM private key')
  .option('-b, --btc-key <key>', 'BTC private key')
  .option('--evm-rpc <url>', 'EVM RPC URL', 'https://sepolia.drpc.org')
  .option('--btc-rpc <url>', 'BTC RPC URL', 'https://blockstream.info/testnet/api')
  .action(async (options) => {
    try {
      console.log(chalk.blue('\n💰 Checking Real Balances\n'));
      
      const { ethers } = await import('ethers');
      const { RealBtcProvider } = await import('../btc/real-provider');
      const { walletFromPrivateKey } = await import('../btc/htlc');
      const bitcoin = await import('bitcoinjs-lib');
      
      // Check EVM balance
      const provider = new ethers.JsonRpcProvider(options.evmRpc);
      const wallet = new ethers.Wallet(options.evmKey, provider);
      const evmBalance = await provider.getBalance(wallet.address);
      console.log(`🔵 EVM Balance: ${ethers.formatEther(evmBalance)} ETH`);
      
      // Check BTC balance
      const btcProvider = new RealBtcProvider(options.btcRpc, 'testnet');
      const btcWallet = walletFromPrivateKey(options.btcKey, bitcoin.networks.testnet);
      const btcBalance = await btcProvider.getBalance(btcWallet.address);
      console.log(`🟠 BTC Balance: ${btcBalance} satoshis (${btcBalance / 100000000} BTC)`);
      
      // Check resolver balance
      const resolverWallet = walletFromPrivateKey(
        'cUJ4wz3dLzT8v2ZxKtRpU7qyXZ6E1qur87LGCGMehYTkWHnQTMeD',
        bitcoin.networks.testnet
      );
      const resolverBalance = await btcProvider.getBalance(resolverWallet.address);
      console.log(`🔧 Resolver Balance: ${resolverBalance} satoshis (${resolverBalance / 100000000} BTC)`);
      
      if (resolverBalance === 0) {
        console.log(chalk.yellow('⚠️  Warning: Resolver has no BTC. Fund the resolver address:'));
        console.log(chalk.blue(`   ${resolverWallet.address}`));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

async function getRealSwapConfig(options: any, direction: string): Promise<SwapConfig> {
  let evmKey = options.evmKey;
  let btcKey = options.btcKey;
  let amount = options.amount;

  if (!evmKey) {
    const answer = await inquirer.prompt([{
      type: 'password',
      name: 'key',
      message: 'Enter your EVM private key:',
      mask: '*'
    }]);
    evmKey = answer.key;
  }

  if (!btcKey) {
    const answer = await inquirer.prompt([{
      type: 'password',
      name: 'key',
      message: 'Enter your BTC private key:',
      mask: '*'
    }]);
    btcKey = answer.key;
  }

  if (!amount) {
    const answer = await inquirer.prompt([{
      type: 'input',
      name: 'amount',
      message: 'Enter amount to swap (in wei):',
      validate: (input) => {
        if (!input || isNaN(Number(input))) {
          return 'Please enter a valid number';
        }
        return true;
      }
    }]);
    amount = answer.amount;
  }

  return {
    evmPrivateKey: evmKey,
    btcPrivateKey: btcKey,
    amount: amount,
    evmRpcUrl: options.evmRpc || 'https://sepolia.drpc.org',
    btcRpcUrl: options.btcRpc || 'https://blockstream.info/testnet/api'
  };
}

program.parse();
