#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { EvmToBtcSwap } from '../swap/evm-to-btc';
import { BtcToEvmSwap } from '../swap/btc-to-evm';
import { BtcToPyusdSwap } from '../swap/btc-to-pyusd';
import { PyusdToBtcSwap } from '../swap/pyusd-to-btc';
import { EscrowManager } from '../mock/escrow-manager';
import { AutoPayManager } from '../evm/autopay-manager';
import { SwapConfig } from '../types';
import { ethers } from 'ethers';
import { EvmWalletManager } from '../evm/wallet';
import { BtcProvider } from '../btc/provider';
import { walletFromPrivateKey } from '../btc/htlc';
import * as bitcoin from 'bitcoinjs-lib';

const program = new Command();

program
  .name('atomic-swap')
  .description('CLI for atomic swaps between EVM Sepolia and BTC Testnet4')
  .version('1.0.0');

program
  .command('evm-to-btc')
  .description('Swap EVM tokens to BTC')
  .option('-e, --evm-key <key>', 'EVM private key')
  .option('-b, --btc-key <key>', 'BTC private key')
  .option('-a, --amount <amount>', 'Amount to swap (in wei)')
  .option('--evm-rpc <url>', 'EVM RPC URL', 'https://sepolia.infura.io/v3/YOUR_KEY')
  .option('--btc-rpc <url>', 'BTC RPC URL', 'https://blockstream.info/testnet/api')
  .action(async (options, command) => {
    try {
      console.log('🔧 Debug - Raw options received:', JSON.stringify(options, null, 2));
      console.log('🔧 Debug - Command args:', command.args);
      const config = await getSwapConfig(options, 'evm-to-btc');
      const swap = new EvmToBtcSwap(config);
      
      const spinner = ora('Creating swap order...').start();
      const order = await swap.createOrder();
      spinner.succeed('Order created');

      const executeSpinner = ora('Executing swap...').start();
      const result = await swap.executeSwap(order);
      
      if (result.phase === 'completed') {
        executeSpinner.succeed('Swap completed successfully!');
        console.log(chalk.green('\n🎉 Swap Results:'));
        console.log(chalk.blue('Order Hash:'), result.txHashes?.evm);
        console.log(chalk.blue('BTC TX:'), result.txHashes?.btc);
      } else {
        executeSpinner.fail('Swap failed');
        console.log(chalk.red('Error:'), result.message);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('btc-to-evm')
  .description('Swap BTC to EVM tokens')
  .option('-e, --evm-key <key>', 'EVM private key')
  .option('-b, --btc-key <key>', 'BTC private key')
  .option('-a, --amount <amount>', 'Amount to swap (in satoshis)')
  .option('--evm-rpc <url>', 'EVM RPC URL', 'https://sepolia.infura.io/v3/YOUR_KEY')
  .option('--btc-rpc <url>', 'BTC RPC URL', 'https://blockstream.info/testnet/api')
  .action(async (options) => {
    try {
      const config = await getSwapConfig(options, 'btc-to-evm');
      const swap = new BtcToEvmSwap(config);
      
      const spinner = ora('Creating swap order...').start();
      const order = await swap.createOrder();
      spinner.succeed('Order created');

      const executeSpinner = ora('Executing swap...').start();
      const result = await swap.executeSwap(order);
      
      if (result.phase === 'completed') {
        executeSpinner.succeed('Swap completed successfully!');
        console.log(chalk.green('\n🎉 Swap Results:'));
        console.log(chalk.blue('Order Hash:'), result.txHashes?.evm);
        console.log(chalk.blue('BTC TX:'), result.txHashes?.btc);
      } else {
        executeSpinner.fail('Swap failed');
        console.log(chalk.red('Error:'), result.message);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('btc-to-pyusd')
  .description('Swap BTC to PYUSD (PayPal USD)')
  .option('-e, --evm-key <key>', 'EVM private key')
  .option('-b, --btc-key <key>', 'BTC private key')
  .option('-a, --amount <amount>', 'Amount to swap (in satoshis)')
  .option('--evm-rpc <url>', 'EVM RPC URL', 'https://eth-sepolia.g.alchemy.com/v2/CQENf_IMmkawSrqgpR14l')
  .option('--btc-rpc <url>', 'BTC RPC URL', 'https://blockstream.info/testnet/api')
  .action(async (options) => {
    try {
      console.log('🚀 BTC → PYUSD Atomic Swap\n');
      const config = await getSwapConfig(options, 'btc-to-pyusd');
      const swap = new BtcToPyusdSwap(config);
      
      const spinner = ora('Creating swap order...').start();
      const order = await swap.createOrder();
      spinner.succeed('Order created');

      const executeSpinner = ora('Executing swap...').start();
      const result = await swap.executeSwap(order);
      
      if (result.phase === 'completed') {
        executeSpinner.succeed('Swap completed successfully!');
        console.log(chalk.green('\n🎉 Swap Results:'));
        console.log(chalk.blue('Order Hash:'), result.txHashes?.evm);
        console.log(chalk.blue('BTC TX:'), result.txHashes?.btc);
      } else {
        executeSpinner.fail('Swap failed');
        console.log(chalk.red('Error:'), result.message);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('pyusd-to-btc')
  .description('Swap PYUSD (PayPal USD) to BTC')
  .option('-e, --evm-key <key>', 'EVM private key')
  .option('-b, --btc-key <key>', 'BTC private key (optional)')
  .option('--btc-address <address>', 'BTC address to receive funds (if no private key)')
  .option('-a, --amount <amount>', 'Amount to swap (in PYUSD)')
  .option('--evm-rpc <url>', 'EVM RPC URL', 'https://eth-sepolia.g.alchemy.com/v2/CQENf_IMmkawSrqgpR14l')
  .option('--btc-rpc <url>', 'BTC RPC URL', 'https://blockstream.info/testnet/api')
  .action(async (options) => {
    try {
      console.log('🚀 PYUSD → BTC Atomic Swap\n');
      const config = await getSwapConfig(options, 'pyusd-to-btc');
      const swap = new PyusdToBtcSwap(config);
      
      const spinner = ora('Creating swap order...').start();
      const order = await swap.createOrder();
      spinner.succeed('Order created');

      const executeSpinner = ora('Executing swap...').start();
      const result = await swap.executeSwap(order);
      
      if (result.phase === 'completed') {
        executeSpinner.succeed('Swap completed successfully!');
        console.log(chalk.green('\n🎉 Swap Results:'));
        console.log(chalk.blue('Order Hash:'), result.txHashes?.evm);
        console.log(chalk.blue('BTC TX:'), result.txHashes?.btc);
      } else {
        executeSpinner.fail('Swap failed');
        console.log(chalk.red('Error:'), result.message);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('demo-escrow-complete')
  .description('Complete demo: deploy Escrow, fund it, and run atomic swap')
  .action(async () => {
    console.log('🎯 BTC ↔ PYUSD Atomic Swap Demo\n');
    console.log('This demonstrates a complete atomic swap flow with real on-chain transactions.\n');
    
    const config: SwapConfig = {
      evmPrivateKey: '0x1009aeecc8509ac354e5dd2d765ba5a5d0da75f311ffed141f8d0d2fb2c14556',
      btcPrivateKey: 'cSA7m2GUbwpa6HedKN6TpN4c2xdT2zL22tRbXNZKr9sTJEpXitbU',
      amount: '1000000', // 1 PYUSD (6 decimals)
      evmRpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/CQENf_IMmkawSrqgpR14l',
      btcRpcUrl: 'https://blockstream.info/testnet/api',
      pyusdAddress: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9'
    };
    
    try {
      console.log('🚀 Initiating atomic swap...');
      
      // Check initial balances
      console.log('\n💰 Checking initial balances...');
      const evmWallet = new EvmWalletManager(config.evmPrivateKey, config.evmRpcUrl);
      const btcProvider = new BtcProvider(config.btcRpcUrl, 'testnet', false);
      
      console.log('📊 Account Information:');
      console.log('   EVM Address:', '0x777c5966E8327EbEcAbB21b043ACeDE9acBaCA7B'); // Maker address
      if (config.btcPrivateKey) {
        console.log('   BTC Address:', walletFromPrivateKey(config.btcPrivateKey, bitcoin.networks.testnet).address);
      } else if (config.btcAddress) {
        console.log('   BTC Address:', config.btcAddress);
      }
      
      // Check EVM balances for Maker address
      const makerAddress = '0x777c5966E8327EbEcAbB21b043ACeDE9acBaCA7B';
      const makerWallet = new EvmWalletManager('0x1009aeecc8509ac354e5dd2d765ba5a5d0da75f311ffed141f8d0d2fb2c14556', config.evmRpcUrl);
      
      const ethBalance = await makerWallet.getBalance();
      console.log('   ETH Balance:', ethers.formatEther(ethBalance), 'ETH');
      
      if (config.pyusdAddress) {
        const pyusdBalance = await makerWallet.getPyusdBalance(config.pyusdAddress);
        console.log('   PYUSD Balance:', ethers.formatUnits(pyusdBalance, 6), 'PYUSD');
      }
      
      // Check BTC balance
      if (!config.btcPrivateKey) {
        console.log('❌ BTC private key required for this operation');
        return;
      }
      const btcWallet = walletFromPrivateKey(config.btcPrivateKey, bitcoin.networks.testnet);
      try {
        const btcBalance = await btcProvider.getBalance(btcWallet.address);
        console.log('   BTC Balance:', btcBalance, 'satoshis');
        console.log('   BTC Balance:', (btcBalance / 100000000).toFixed(8), 'BTC');
      } catch (error) {
        console.log('   BTC Balance: Unable to fetch (network issue)');
        console.log('   BTC Address:', btcWallet.address);
        // Try alternative BTC provider
        try {
          const altBtcProvider = new BtcProvider('https://blockstream.info/testnet/api', 'testnet', false);
          const altBtcBalance = await altBtcProvider.getBalance(btcWallet.address);
          console.log('   BTC Balance (alt):', altBtcBalance, 'satoshis');
          console.log('   BTC Balance (alt):', (altBtcBalance / 100000000).toFixed(8), 'BTC');
        } catch (altError) {
          console.log('   BTC Balance: Network unavailable');
        }
      }
      
      console.log('\n🔧 Deploying Escrow contract...');
      
      // Deploy Escrow behind the scenes (hidden from user)
      const { deployEscrowAuto } = require('../../scripts/deploy-escrow-auto.js');
      const escrowAddress = await deployEscrowAuto();
      
      if (!escrowAddress) {
        console.log('❌ Swap initialization failed. Cannot proceed.');
        return;
      }
      
      console.log('✅ Escrow contract ready');
      
      // Automatically run the swap with the deployed Escrow
      const swap = new BtcToPyusdSwap(config);
      swap.setupEscrow(escrowAddress);
      
      const order = await swap.createOrder();
      const result = await swap.executeSwap(order);
      
      if (result.phase === 'completed') {
        console.log(chalk.green('\n🎉 Complete BTC to PYUSD atomic swap completed successfully!'));
        console.log(chalk.blue('BTC TX:'), result.txHashes?.btc);
        console.log(chalk.blue('PYUSD TX:'), result.txHashes?.evm);
      } else {
        console.log(chalk.red('\n❌ Swap failed:'), result.message);
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
    }
  });

program
  .command('interactive')
  .description('Interactive swap mode')
  .action(async () => {
    try {
      console.log(chalk.blue('\n🚀 Welcome to Atomic Swap CLI!\n'));
      
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'direction',
          message: 'Choose swap direction:',
          choices: [
            { name: 'EVM → BTC', value: 'evm-to-btc' },
            { name: 'BTC → EVM', value: 'btc-to-evm' }
          ]
        },
        {
          type: 'password',
          name: 'evmKey',
          message: 'Enter your EVM private key:',
          mask: '*'
        },
        {
          type: 'password',
          name: 'btcKey',
          message: 'Enter your BTC private key:',
          mask: '*'
        },
        {
          type: 'input',
          name: 'amount',
          message: 'Enter amount to swap:',
          validate: (input) => {
            if (!input || isNaN(Number(input))) {
              return 'Please enter a valid number';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'evmRpc',
          message: 'Enter EVM RPC URL:',
          default: 'https://sepolia.infura.io/v3/YOUR_KEY'
        },
        {
          type: 'input',
          name: 'btcRpc',
          message: 'Enter BTC RPC URL:',
          default: 'https://blockstream.info/testnet/api'
        }
      ]);

      const config: SwapConfig = {
        evmPrivateKey: answers.evmKey,
        btcPrivateKey: answers.btcKey,
        amount: answers.amount,
        evmRpcUrl: answers.evmRpc,
        btcRpcUrl: answers.btcRpc
      };

      if (answers.direction === 'evm-to-btc') {
        const swap = new EvmToBtcSwap(config);
        const order = await swap.createOrder();
        const result = await swap.executeSwap(order);
        
        if (result.phase === 'completed') {
          console.log(chalk.green('\n🎉 Swap completed successfully!'));
        } else {
          console.log(chalk.red('\n❌ Swap failed:'), result.message);
        }
      } else {
        const swap = new BtcToEvmSwap(config);
        const order = await swap.createOrder();
        const result = await swap.executeSwap(order);
        
        if (result.phase === 'completed') {
          console.log(chalk.green('\n🎉 Swap completed successfully!'));
        } else {
          console.log(chalk.red('\n❌ Swap failed:'), result.message);
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('deploy-autopay')
  .description('Deploy AutoPay contract with dynamic inputs')
  .option('--merchant <address>', 'Merchant EVM address')
  .option('--amount <amount>', 'Payment amount in PYUSD (6 decimals)')
  .option('--interval <minutes>', 'Payment interval in minutes')
  .option('--duration <hours>', 'Total duration in hours')
  .action(async (options) => {
    console.log('🚀 AutoPay Contract Deployment\n');
    
    // Get inputs from user if not provided
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'merchant',
        message: 'Enter merchant EVM address:',
        default: options.merchant,
        validate: (input) => ethers.isAddress(input) || 'Invalid EVM address'
      },
      {
        type: 'input',
        name: 'amount',
        message: 'Enter payment amount in PYUSD:',
        default: options.amount || '0.25',
        validate: (input) => !isNaN(parseFloat(input)) || 'Invalid amount'
      },
      {
        type: 'input',
        name: 'interval',
        message: 'Enter payment interval in minutes:',
        default: options.interval || '6',
        validate: (input) => !isNaN(parseInt(input)) || 'Invalid interval'
      },
      {
        type: 'input',
        name: 'duration',
        message: 'Enter total duration in hours:',
        default: options.duration || '24',
        validate: (input) => !isNaN(parseInt(input)) || 'Invalid duration'
      }
    ]);

    const paymentAmount = ethers.parseUnits(answers.amount, 6);
    const paymentInterval = parseInt(answers.interval) * 60; // Convert to seconds
    const totalDuration = parseInt(answers.duration) * 3600; // Convert to seconds

    console.log('\n📋 AutoPay Configuration:');
    console.log('   Merchant:', answers.merchant);
    console.log('   Payment Amount:', answers.amount, 'PYUSD');
    console.log('   Payment Interval:', answers.interval, 'minutes');
    console.log('   Total Duration:', answers.duration, 'hours');
    console.log('   Total Payments:', Math.floor(totalDuration / paymentInterval));

    const { deployAutoPay } = require('../../scripts/deploy-autopay.js');
    const autopayAddress = await deployAutoPay(
      answers.merchant,
      paymentAmount,
      paymentInterval,
      totalDuration
    );

    if (autopayAddress) {
      console.log('\n🎉 AutoPay deployed successfully!');
      console.log('Contract Address:', autopayAddress);
      console.log('🔗 Explorer: https://sepolia.etherscan.io/address/' + autopayAddress);
    } else {
      console.log('\n❌ AutoPay deployment failed');
    }
  });

program
  .command('manage-autopay <address> <action>')
  .description('Manage deployed AutoPay contract')
  .action(async (address, action) => {
    console.log('🔧 Debug - Address:', address);
    console.log('🔧 Debug - Action:', action);
    const rpcUrl = 'https://eth-sepolia.g.alchemy.com/v2/CQENf_IMmkawSrqgpR14l';
    const pyusdAddress = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';
    const ownerPrivateKey = '4a174f09cb14c06e2c21ea76afaa82a44ead86ca3d18110f87869c078d0bc559';

    const autopayManager = new AutoPayManager(rpcUrl, ownerPrivateKey, address, pyusdAddress);

    try {
      switch (action) {
        case 'start':
          await autopayManager.startAutoPay();
          break;
        case 'pause':
          await autopayManager.pauseAutoPay();
          break;
        case 'resume':
          await autopayManager.resumeAutoPay();
          break;
        case 'stop':
          await autopayManager.stopAutoPay();
          break;
        case 'execute':
          await autopayManager.executePayment();
          break;
        case 'withdraw':
          await autopayManager.withdrawRemainingFunds();
          break;
        case 'update':
          await autopayManager.updateBalance();
          break;
        case 'info':
        default:
          const info = await autopayManager.getAutoPayInfo();
          console.log('\n📊 AutoPay Information:');
          console.log('   Owner:', info.owner);
          console.log('   Merchant:', info.merchant);
          console.log('   Payment Amount:', ethers.formatUnits(info.paymentAmount, 6), 'PYUSD');
          console.log('   Payment Interval:', info.paymentInterval.toString(), 'seconds');
          console.log('   Total Duration:', info.totalDuration.toString(), 'seconds');
          console.log('   Start Time:', new Date(Number(info.startTime) * 1000).toLocaleString());
          console.log('   Last Payment:', new Date(Number(info.lastPaymentTime) * 1000).toLocaleString());
          console.log('   Total Paid:', ethers.formatUnits(info.totalPaid, 6), 'PYUSD');
          console.log('   Remaining Balance:', ethers.formatUnits(info.remainingBalance, 6), 'PYUSD');
          console.log('   Is Active:', info.isActive);
          console.log('   Is Paused:', info.isPaused);
          break;
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message);
    }
  });

async function getSwapConfig(options: any, direction: string): Promise<SwapConfig> {
  let evmKey = options.evmKey;
  let btcKey = options.btcKey;
  let btcAddress = options.btcAddress;
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

  // For PYUSD → BTC, we can work with just BTC address
  if (direction === 'pyusd-to-btc') {
    if (!btcKey && !btcAddress) {
      const answer = await inquirer.prompt([{
        type: 'list',
        name: 'btcInput',
        message: 'How do you want to provide BTC info?',
        choices: [
          { name: 'BTC Private Key (full control)', value: 'key' },
          { name: 'BTC Address only (receive funds)', value: 'address' }
        ]
      }]);
      
      if (answer.btcInput === 'key') {
        const keyAnswer = await inquirer.prompt([{
          type: 'password',
          name: 'key',
          message: 'Enter your BTC private key:',
          mask: '*'
        }]);
        btcKey = keyAnswer.key;
      } else {
        const addressAnswer = await inquirer.prompt([{
          type: 'input',
          name: 'address',
          message: 'Enter your BTC address to receive funds:',
          validate: (input) => {
            if (!input || input.length < 26) {
              return 'Please enter a valid Bitcoin address';
            }
            return true;
          }
        }]);
        btcAddress = addressAnswer.address;
      }
    }
  } else {
    // For other swaps, BTC private key is required
    if (!btcKey) {
      const answer = await inquirer.prompt([{
        type: 'password',
        name: 'key',
        message: 'Enter your BTC private key:',
        mask: '*'
      }]);
      btcKey = answer.key;
    }
  }

  if (!amount) {
    const answer = await inquirer.prompt([{
      type: 'input',
      name: 'amount',
      message: 'Enter amount to swap:',
      validate: (input) => {
        if (!input || isNaN(Number(input))) {
          return 'Please enter a valid number';
        }
        return true;
      }
    }]);
    amount = answer.amount;
  }

  const config: SwapConfig = {
    evmPrivateKey: evmKey,
    btcPrivateKey: btcKey,
    btcAddress: btcAddress,
    amount: amount,
    evmRpcUrl: options.evmRpc || 'https://sepolia.infura.io/v3/YOUR_KEY',
    btcRpcUrl: options.btcRpc || 'https://blockstream.info/testnet/api'
  };

  // Add PYUSD address for PYUSD-related swaps
  if (direction === 'btc-to-pyusd' || direction === 'pyusd-to-btc') {
    config.pyusdAddress = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';
  }

  return config;
}

program.parse();
