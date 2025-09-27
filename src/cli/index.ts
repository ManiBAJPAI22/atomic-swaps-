#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { EvmToBtcSwap } from '../swap/evm-to-btc';
import { BtcToEvmSwap } from '../swap/btc-to-evm';
import { SwapConfig } from '../types';

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
