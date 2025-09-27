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
  .description('Swap BTC to PYUSD')
  .option('-e, --evm-key <key>', 'EVM private key')
  .option('-b, --btc-key <key>', 'BTC private key')
  .option('-a, --amount <amount>', 'Amount to swap (in satoshis)')
  .option('--evm-rpc <url>', 'EVM RPC URL', 'https://sepolia.infura.io/v3/YOUR_KEY')
  .option('--btc-rpc <url>', 'BTC RPC URL', 'https://blockstream.info/testnet/api')
  .option('--pyusd-address <address>', 'PYUSD contract address', '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9')
  .action(async (options) => {
    try {
      const config = await getSwapConfig(options, 'btc-to-pyusd');
      config.pyusdAddress = options.pyusdAddress;
      const swap = new BtcToPyusdSwap(config);

      const spinner = ora('Creating swap order...').start();
      const order = await swap.createOrder();
      spinner.succeed('Order created');

      const executeSpinner = ora('Executing swap...').start();
      const result = await swap.executeSwap(order);

      if (result.phase === 'completed') {
        executeSpinner.succeed('Swap completed successfully!');
        console.log(chalk.green('\n🎉 Swap Results:'));
        console.log(chalk.blue('Order Hash:'), result.txHashes?.btc);
        console.log(chalk.blue('PYUSD TX:'), result.txHashes?.evm);
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
  .description('Swap PYUSD to BTC')
  .option('-e, --evm-key <key>', 'EVM private key')
  .option('-b, --btc-key <key>', 'BTC private key')
  .option('-a, --amount <amount>', 'Amount to swap (in PYUSD with 6 decimals)')
  .option('--evm-rpc <url>', 'EVM RPC URL', 'https://sepolia.infura.io/v3/YOUR_KEY')
  .option('--btc-rpc <url>', 'BTC RPC URL', 'https://blockstream.info/testnet/api')
  .option('--pyusd-address <address>', 'PYUSD contract address', '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9')
  .action(async (options) => {
    try {
      const config = await getSwapConfig(options, 'pyusd-to-btc');
      config.pyusdAddress = options.pyusdAddress;
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
  .command('check-balances')
  .description('Check EVM and BTC balances')
  .action(async () => {
    console.log('💰 Checking Account Balances\n');
    
    const config: SwapConfig = {
      evmPrivateKey: '0x16fc63853f076f6d09a7aa3621f4ed5f91d9b1629398b6b846e376740c11e3cc',
      btcPrivateKey: 'cSA7m2GUbwpa6HedKN6TpN4c2xdT2zL22tRbXNZKr9sTJEpXitbU',
      amount: '1000000',
      evmRpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/CQENf_IMmkawSrqgpR14l',
      btcRpcUrl: 'https://mempool.space/testnet/api',
      pyusdAddress: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9'
    };
    
    try {
      const evmWallet = new EvmWalletManager(config.evmPrivateKey, config.evmRpcUrl);
      const btcProvider = new BtcProvider(config.btcRpcUrl, 'testnet', false);
      
      console.log('📊 Account Information:');
      console.log('   EVM Address:', evmWallet.getWallet().address);
      console.log('   BTC Address:', walletFromPrivateKey(config.btcPrivateKey, bitcoin.networks.testnet).address);
      console.log('');
      
      // Check EVM ETH balance
      console.log('🔍 Checking EVM balances...');
      const ethBalance = await evmWallet.getBalance();
      console.log('   ETH Balance:', ethers.formatEther(ethBalance), 'ETH');
      
      // Check PYUSD balance
      if (config.pyusdAddress) {
        const pyusdBalance = await evmWallet.getPyusdBalance(config.pyusdAddress);
        console.log('   PYUSD Balance:', ethers.formatUnits(pyusdBalance, 6), 'PYUSD');
      }
      
      // Check BTC balance
      console.log('\n🔍 Checking BTC balance...');
      const btcWallet = walletFromPrivateKey(config.btcPrivateKey, bitcoin.networks.testnet);
      try {
        const btcBalance = await btcProvider.getBalance(btcWallet.address);
        console.log('   BTC Balance:', btcBalance, 'satoshis');
        console.log('   BTC Balance:', (btcBalance / 100000000).toFixed(8), 'BTC');
      } catch (error) {
        console.log('   BTC Balance: Unable to fetch (network issue)');
      }
      
      console.log('\n✅ Balance check complete!');
      
    } catch (error) {
      console.error(chalk.red('❌ Error checking balances:'), error);
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
      btcRpcUrl: 'https://mempool.space/testnet/api',
      pyusdAddress: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9'
    };
    
    try {
      console.log('🚀 Initiating atomic swap...');
      
      console.log('🔧 Deploying Escrow contract...');
      
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
  .command('demo-escrow')
  .description('Demo with Escrow contract deployment and real PYUSD transfers')
  .option('--escrow-address <address>', 'Pre-deployed Escrow contract address')
  .action(async (options) => {
    console.log('🎯 BTC ↔ PYUSD Atomic Swap with Escrow Demo\n');
    console.log('This demonstrates the complete atomic swap flow with Escrow contract.');
    console.log('The Escrow will be deployed and funded with PYUSD, then used for the swap.\n');
    
    const config: SwapConfig = {
      evmPrivateKey: '0x16fc63853f076f6d09a7aa3621f4ed5f91d9b1629398b6b846e376740c11e3cc',
      btcPrivateKey: 'cSA7m2GUbwpa6HedKN6TpN4c2xdT2zL22tRbXNZKr9sTJEpXitbU',
      amount: '1000000', // 1 PYUSD (6 decimals)
      evmRpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/CQENf_IMmkawSrqgpR14l',
      btcRpcUrl: 'https://mempool.space/testnet/api',
      pyusdAddress: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9'
    };
    
    try {
      let escrowAddress = options.escrowAddress;
      
      if (!escrowAddress) {
        console.log('🚀 Deploying Escrow contract...');
        console.log('💡 For now, please deploy the Escrow contract manually using:');
        console.log('   - Remix IDE: https://remix.ethereum.org/');
        console.log('   - Contract: contracts/Escrow.sol');
        console.log('   - Constructor args:');
        console.log('     - _pyusdToken: 0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9');
        console.log('     - _makerAddress: 0x777c5966E8327EbEcAbB21b043ACeDE9acBaCA7B');
        console.log('   - Deployer private key: 1009aeecc8509ac354e5dd2d765ba5a5d0da75f311ffed141f8d0d2fb2c14556');
        console.log('   - After deployment, call fundEscrow(10000000) to fund with 10 PYUSD');
        console.log('');
        console.log('Then run: npm run demo-escrow -- --escrow-address <DEPLOYED_ADDRESS>');
        return;
      }
      
      console.log('✅ Using pre-deployed Escrow:', escrowAddress);
      
      // Initialize Escrow manager
      const escrowManager = new EscrowManager(
        config.evmRpcUrl,
        '1009aeecc8509ac354e5dd2d765ba5a5d0da75f311ffed141f8d0d2fb2c14556',
        escrowAddress,
        config.pyusdAddress!
      );
      
      // Check escrow status
      const escrowInfo = await escrowManager.getEscrowInfo();
      console.log('📊 Escrow Contract Info:');
      console.log('   Owner:', escrowInfo.owner);
      console.log('   PYUSD Token:', escrowInfo.pyusdToken);
      console.log('   Maker Address:', escrowInfo.makerAddress);
      console.log('   Balance:', ethers.formatUnits(escrowInfo.balance, 6), 'PYUSD');
      
      if (escrowInfo.balance === 0n) {
        console.log('⚠️  Escrow has no PYUSD balance. Please fund it first.');
        console.log('   Call fundEscrow(10000000) to fund with 10 PYUSD');
        return;
      }
      
      console.log('\n🚀 Starting BTC to PYUSD atomic swap with Escrow...\n');
      
      const swap = new BtcToPyusdSwap(config);
      swap.setupEscrow(escrowAddress);
      
      const order = await swap.createOrder();
      const result = await swap.executeSwap(order);
      
      if (result.phase === 'completed') {
        console.log(chalk.green('\n🎉 BTC to PYUSD atomic swap with Escrow completed successfully!'));
        console.log(chalk.blue('BTC TX:'), result.txHashes?.btc);
        console.log(chalk.blue('PYUSD TX:'), result.txHashes?.evm);
        console.log('\n💡 The maker received real PYUSD via the Escrow contract!');
      } else {
        console.log(chalk.red('\n❌ Swap failed:'), result.message);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
    }
  });

program
  .command('demo-mock')
  .description('Demo with atomic swap flow (always works)')
  .action(async () => {
    console.log('🎯 BTC ↔ PYUSD Atomic Swap Demo\n');
    console.log('This demonstrates the complete atomic swap flow with real testnet transactions.');
    console.log('If testnet RPC is unavailable, it will automatically fallback to simulation mode.\n');
    
    const config: SwapConfig = {
      evmPrivateKey: '0x16fc63853f076f6d09a7aa3621f4ed5f91d9b1629398b6b846e376740c11e3cc',
      btcPrivateKey: 'cSA7m2GUbwpa6HedKN6TpN4c2xdT2zL22tRbXNZKr9sTJEpXitbU',
      amount: '1000000', // 1 PYUSD (6 decimals)
      evmRpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/CQENf_IMmkawSrqgpR14l',
      btcRpcUrl: 'https://mempool.space/testnet/api', // Try real testnet first
      pyusdAddress: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9'
    };
    
    console.log('🚀 Starting mock BTC to PYUSD atomic swap demo...\n');
    
    try {
      const swap = new BtcToPyusdSwap(config);
      const order = await swap.createOrder();
      const result = await swap.executeSwap(order);
      
      if (result.phase === 'completed') {
        console.log(chalk.green('\n🎉 BTC to PYUSD atomic swap completed successfully!'));
        console.log(chalk.blue('BTC TX:'), result.txHashes?.btc);
        console.log(chalk.blue('PYUSD TX:'), result.txHashes?.evm);
        console.log('\n💡 This demonstrates the complete atomic swap flow.');
        console.log('💡 Use "demo-real" command for actual testnet transactions.');
      } else {
        console.log(chalk.red('\n❌ Swap failed:'), result.message);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
    }
  });

program
  .command('demo-real')
  .description('Real testnet demo with actual on-chain transactions')
  .action(async () => {
    console.log('🎯 Real Testnet Atomic Swap Demo\n');
    console.log('This will perform REAL on-chain transactions using testnet networks.\n');
    console.log('⚠️  SAFETY: This uses only testnet networks (Sepolia & Testnet3)');
    console.log('⚠️  No real money is involved - completely safe!\n');
    
    const answer = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: 'Do you want to proceed with real testnet demo?',
      default: false
    }]);
    
    if (!answer.proceed) {
      console.log('Demo cancelled. Use mock mode for safe testing:');
      console.log('npx ts-node src/index.ts evm-to-btc --btc-rpc "https://mock.btc.api"');
      return;
    }
    
    // Generate testnet wallets
    const { generateTestnetWallets } = require('../../testnet-setup');
    const wallets = generateTestnetWallets();
    
    console.log('\n🔑 Generated testnet wallets:');
    console.log(`📱 EVM: ${wallets.evm.address}`);
    console.log(`₿ BTC: ${wallets.btc.address}\n`);
    
    console.log('🚰 Get testnet funds from:');
    console.log('   EVM: https://sepoliafaucet.com/');
    console.log('   BTC: https://testnet-faucet.mempool.co/\n');
    
    const config: SwapConfig = {
      evmPrivateKey: wallets.evm.privateKey,
      btcPrivateKey: wallets.btc.privateKey,
      amount: '1000000000000000', // 0.001 ETH
      evmRpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY',
      btcRpcUrl: 'https://mempool.space/testnet/api'
    };
    
    console.log('🚀 Starting real testnet swap...\n');
    
    try {
      const swap = new EvmToBtcSwap(config);
      const order = await swap.createOrder();
      const result = await swap.executeSwap(order);
      
      if (result.phase === 'completed') {
        console.log(chalk.green('\n🎉 Real testnet swap completed!'));
        console.log(chalk.blue('EVM TX:'), result.txHashes?.evm);
        console.log(chalk.blue('BTC TX:'), result.txHashes?.btc);
        console.log('\n🔍 Check transactions on:');
        console.log(`   EVM: https://sepolia.etherscan.io/address/${wallets.evm.address}`);
        console.log(`   BTC: https://mempool.space/testnet/address/${wallets.btc.address}`);
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
            { name: 'BTC → EVM', value: 'btc-to-evm' },
            { name: 'BTC → PYUSD', value: 'btc-to-pyusd' },
            { name: 'PYUSD → BTC', value: 'pyusd-to-btc' }
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
      } else if (answers.direction === 'btc-to-evm') {
        const swap = new BtcToEvmSwap(config);
        const order = await swap.createOrder();
        const result = await swap.executeSwap(order);
        
        if (result.phase === 'completed') {
          console.log(chalk.green('\n🎉 Swap completed successfully!'));
        } else {
          console.log(chalk.red('\n❌ Swap failed:'), result.message);
        }
      } else if (answers.direction === 'btc-to-pyusd') {
        config.pyusdAddress = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';
        const swap = new BtcToPyusdSwap(config);
        const order = await swap.createOrder();
        const result = await swap.executeSwap(order);
        
        if (result.phase === 'completed') {
          console.log(chalk.green('\n🎉 BTC to PYUSD swap completed successfully!'));
        } else {
          console.log(chalk.red('\n❌ Swap failed:'), result.message);
        }
      } else if (answers.direction === 'pyusd-to-btc') {
        config.pyusdAddress = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';
        const swap = new PyusdToBtcSwap(config);
        const order = await swap.createOrder();
        const result = await swap.executeSwap(order);
        
        if (result.phase === 'completed') {
          console.log(chalk.green('\n🎉 PYUSD to BTC swap completed successfully!'));
        } else {
          console.log(chalk.red('\n❌ Swap failed:'), result.message);
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

async function getSwapConfig(options: any, direction: string): Promise<SwapConfig> {
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

  return {
    evmPrivateKey: evmKey,
    btcPrivateKey: btcKey,
    amount: amount,
    evmRpcUrl: options.evmRpc || 'https://sepolia.infura.io/v3/YOUR_KEY',
    btcRpcUrl: options.btcRpc || 'https://blockstream.info/testnet/api'
  };
}

program.parse();
