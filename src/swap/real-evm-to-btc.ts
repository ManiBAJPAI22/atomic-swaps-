import * as bitcoin from 'bitcoinjs-lib';
import { randomBytes } from 'crypto';
import { RealEvmWalletManager } from '../evm/real-wallet';
import { RealBtcProvider } from '../btc/real-provider';
import { createDstHtlcScript, walletFromPrivateKey, addressToEthAddressFormat } from '../btc/htlc';
import { SwapConfig, SwapOrder, SwapStatus } from '../types';

export class RealEvmToBtcSwap {
  private evmWallet: RealEvmWalletManager;
  private btcProvider: RealBtcProvider;
  private config: SwapConfig;
  private escrowContractAddress: string;

  constructor(config: SwapConfig, escrowContractAddress: string) {
    this.config = config;
    this.escrowContractAddress = escrowContractAddress;
    this.evmWallet = new RealEvmWalletManager(config.evmPrivateKey, config.evmRpcUrl, escrowContractAddress);
    this.btcProvider = new RealBtcProvider(config.btcRpcUrl, 'testnet');
  }

  async createOrder(): Promise<SwapOrder> {
    console.log('🔄 Creating real EVM to BTC swap order...');

    const secret = randomBytes(32);
    const hashLock = {
      keccak256: this.keccak256(secret),
      sha256: bitcoin.crypto.sha256(secret)
    };

    const orderHash = this.generateOrderHash();
    const amount = BigInt(this.config.amount);

    const order: SwapOrder = {
      orderHash,
      secret,
      hashLock,
      srcChainId: 11155111, // Sepolia
      dstChainId: 99999, // BTC Testnet
      makingAmount: amount,
      takingAmount: amount
    };

    console.log('✅ Real order created:', {
      orderHash,
      secret: secret.toString('hex'),
      amount: amount.toString()
    });

    return order;
  }

  async executeSwap(order: SwapOrder): Promise<SwapStatus> {
    try {
      console.log('🚀 Starting REAL EVM to BTC swap execution...');

      // Check connections first
      await this.checkConnections();

      // Phase 1: Create real EVM escrow
      console.log('📝 Phase 1: Creating real EVM escrow...');
      const evmTxHash = await this.createRealEvmEscrow(order);
      
      // Phase 2: Create real BTC HTLC
      console.log('📝 Phase 2: Creating real BTC HTLC...');
      const btcTxHash = await this.createRealBtcHtlc(order);

      // Phase 3: Wait for real confirmations
      console.log('📝 Phase 3: Waiting for real confirmations...');
      await this.waitForRealConfirmations(evmTxHash, btcTxHash);

      // Phase 4: User claims BTC
      console.log('📝 Phase 4: User claims BTC...');
      const claimTxHash = await this.claimRealBtc(order);

      return {
        phase: 'completed',
        message: 'Real swap completed successfully',
        txHashes: {
          evm: evmTxHash,
          btc: claimTxHash
        }
      };

    } catch (error) {
      console.error('❌ Real swap failed:', error);
      return {
        phase: 'failed',
        message: `Real swap failed: ${error}`
      };
    }
  }

  private async checkConnections(): Promise<void> {
    console.log('🔍 Checking network connections...');
    
    // Check EVM connection
    const evmBalance = await this.evmWallet.getBalance();
    console.log(`✅ EVM connected - Balance: ${ethers.formatEther(evmBalance)} ETH`);
    
    // Check BTC connection
    const btcConnected = await this.btcProvider.checkConnection();
    if (!btcConnected) {
      throw new Error('Failed to connect to Bitcoin testnet');
    }
    
    console.log('✅ All network connections verified');
  }

  private async createRealEvmEscrow(order: SwapOrder): Promise<string> {
    const wallet = this.evmWallet.getWallet();
    
    // Check balance
    const balance = await this.evmWallet.getBalance();
    if (balance < order.makingAmount) {
      throw new Error(`Insufficient ETH balance. Required: ${ethers.formatEther(order.makingAmount)} ETH, Available: ${ethers.formatEther(balance)} ETH`);
    }

    // Set timelock to 1 hour from now
    const timelock = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour

    const txHash = await this.evmWallet.createRealEscrow(
      wallet.address, // maker
      wallet.address, // taker (same for demo)
      order.makingAmount,
      order.orderHash,
      order.hashLock.keccak256,
      timelock
    );

    return txHash;
  }

  private async createRealBtcHtlc(order: SwapOrder): Promise<string> {
    const btcUser = walletFromPrivateKey(this.config.btcPrivateKey, bitcoin.networks.testnet);
    const btcResolver = walletFromPrivateKey(
      'cUJ4wz3dLzT8v2ZxKtRpU7qyXZ6E1qur87LGCGMehYTkWHnQTMeD', // Resolver private key
      bitcoin.networks.testnet
    );

    // Create HTLC script
    const htlcScript = createDstHtlcScript(
      order.orderHash,
      order.hashLock.sha256,
      512, // 512 seconds timelock
      1024, // 1024 seconds cancellation
      btcUser.publicKey,
      btcResolver.publicKey
    );

    // Create P2SH address
    const p2sh = bitcoin.payments.p2sh({
      redeem: { output: htlcScript, network: bitcoin.networks.testnet },
      network: bitcoin.networks.testnet
    });

    console.log('🧾 Real HTLC Address:', p2sh.address);
    console.log('🔍 HTLC Script Hash:', bitcoin.crypto.hash160(htlcScript).toString('hex'));

    // Get real UTXOs
    const utxos = await this.btcProvider.getUtxos(btcResolver.address);
    if (utxos.length === 0) {
      throw new Error('No UTXOs available for resolver. Please fund the resolver address first.');
    }

    console.log(`💰 Resolver has ${utxos.length} UTXOs with total value: ${utxos.reduce((sum, utxo) => sum + utxo.value, 0)} satoshis`);

    // Create funding transaction
    const psbt = new bitcoin.Psbt({ network: bitcoin.networks.testnet });
    
    // Add inputs
    for (const utxo of utxos) {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: bitcoin.payments.p2wpkh({ pubkey: btcResolver.publicKey, network: bitcoin.networks.testnet }).output!,
          value: utxo.value
        }
      });
    }

    // Add HTLC output - use a reasonable amount in satoshis
    const btcAmount = 100000; // 0.001 BTC in satoshis
    psbt.addOutput({
      script: p2sh.output!,
      value: btcAmount
    });

    // Add change output
    const totalInput = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
    const fee = 10000;
    const change = totalInput - btcAmount - fee;
    
    if (change > 0) {
      psbt.addOutput({
        address: btcResolver.address,
        value: change
      });
    }

    // Sign inputs
    for (let i = 0; i < utxos.length; i++) {
      psbt.signInput(i, btcResolver.keyPair);
    }

    psbt.finalizeAllInputs();
    const txHex = psbt.extractTransaction().toHex();

    // Broadcast real transaction
    const txHash = await this.btcProvider.broadcastTx(txHex);
    console.log('✅ Real BTC HTLC funded:', txHash);

    return txHash;
  }

  private async waitForRealConfirmations(evmTxHash: string, btcTxHash: string): Promise<void> {
    console.log('⏳ Waiting for real transaction confirmations...');
    
    // Wait for BTC confirmation
    await this.btcProvider.waitForTxConfirmation(btcTxHash);
    
    // Wait for EVM confirmation
    await this.evmWallet.waitForTransaction(evmTxHash);
    
    console.log('✅ All real transactions confirmed');
  }

  private async claimRealBtc(order: SwapOrder): Promise<string> {
    const btcUser = walletFromPrivateKey(this.config.btcPrivateKey, bitcoin.networks.testnet);
    
    // Get real HTLC UTXOs
    const htlcAddress = this.getHtlcAddress(order);
    console.log('🔍 Real HTLC Address for claiming:', htlcAddress);
    
    const utxos = await this.btcProvider.getUtxos(htlcAddress);
    console.log('🔍 Real UTXOs found:', utxos.length);
    
    if (utxos.length === 0) {
      throw new Error('No UTXOs found at HTLC address');
    }

    const htlcUtxo = utxos[0];
    const rawTxHex = await this.btcProvider.getRawTransactionHex(htlcUtxo.txid);

    // Create real spending transaction
    const psbt = new bitcoin.Psbt({ network: bitcoin.networks.testnet });
    
    psbt.addInput({
      hash: htlcUtxo.txid,
      index: htlcUtxo.vout,
      nonWitnessUtxo: Buffer.from(rawTxHex, 'hex'),
      redeemScript: this.getHtlcScript(order),
      sequence: 0x10000000
    });

    const fee = 1000;
    const redeemValue = htlcUtxo.value - fee;
    
    psbt.addOutput({
      address: btcUser.address,
      value: redeemValue
    });

    // Sign with user's key
    psbt.signInput(0, btcUser.keyPair);

    // Finalize with HTLC script
    psbt.finalizeInput(0, (inputIndex: number, input: any) => {
      const signature = input.partialSig[0].signature;
      const unlockingScript = bitcoin.script.compile([
        signature,
        order.secret,
        bitcoin.opcodes.OP_TRUE
      ]);

      const payment = bitcoin.payments.p2sh({
        redeem: {
          input: unlockingScript,
          output: this.getHtlcScript(order)
        }
      });

      return {
        finalScriptSig: payment.input,
        finalScriptWitness: undefined
      };
    });

    const finalTxHex = psbt.extractTransaction().toHex();
    const txHash = await this.btcProvider.broadcastTx(finalTxHex);

    console.log('✅ Real BTC claimed:', txHash);
    return txHash;
  }

  private getHtlcAddress(order: SwapOrder): string {
    const htlcScript = this.getHtlcScript(order);
    const p2sh = bitcoin.payments.p2sh({
      redeem: { output: htlcScript, network: bitcoin.networks.testnet },
      network: bitcoin.networks.testnet
    });
    return p2sh.address!;
  }

  private getHtlcScript(order: SwapOrder): Buffer {
    const btcUser = walletFromPrivateKey(this.config.btcPrivateKey, bitcoin.networks.testnet);
    const btcResolver = walletFromPrivateKey(
      'cUJ4wz3dLzT8v2ZxKtRpU7qyXZ6E1qur87LGCGMehYTkWHnQTMeD',
      bitcoin.networks.testnet
    );

    return createDstHtlcScript(
      order.orderHash,
      order.hashLock.sha256,
      512,
      1024,
      btcUser.publicKey,
      btcResolver.publicKey
    );
  }

  private keccak256(data: Buffer): string {
    const crypto = require('crypto');
    return '0x' + crypto.createHash('sha3-256').update(data).digest('hex');
  }

  private generateOrderHash(): string {
    return '0x' + randomBytes(32).toString('hex');
  }
}

// Import ethers for formatting
import { ethers } from 'ethers';
