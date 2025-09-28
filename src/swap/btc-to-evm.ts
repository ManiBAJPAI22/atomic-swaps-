import * as bitcoin from 'bitcoinjs-lib';
import { randomBytes } from 'crypto';
import { EvmWalletManager } from '../evm/wallet';
import { BtcProvider } from '../btc/provider';
import { createSrcHtlcScript, walletFromPrivateKey, addressToEthAddressFormat } from '../btc/htlc';
import { SwapConfig, SwapOrder, SwapStatus } from '../types';

export class BtcToEvmSwap {
  private evmWallet: EvmWalletManager;
  private btcProvider: BtcProvider;
  private config: SwapConfig;

  constructor(config: SwapConfig) {
    this.config = config;
    this.evmWallet = new EvmWalletManager(config.evmPrivateKey, config.evmRpcUrl);
    this.btcProvider = new BtcProvider(config.btcRpcUrl, 'testnet', true); // Enable mock mode
  }

  async createOrder(): Promise<SwapOrder> {
    console.log('🔄 Creating BTC to EVM swap order...');

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
      srcChainId: 99999, // BTC Testnet
      dstChainId: 11155111, // Sepolia
      makingAmount: amount,
      takingAmount: amount
    };

    console.log('✅ Order created:', {
      orderHash,
      secret: secret.toString('hex'),
      amount: amount.toString()
    });

    return order;
  }

  async executeSwap(order: SwapOrder): Promise<SwapStatus> {
    try {
      console.log('🚀 Starting BTC to EVM swap execution...');

      // Phase 1: Create and fund BTC HTLC
      console.log('📝 Phase 1: Creating and funding BTC HTLC...');
      const btcTxHash = await this.createAndFundBtcHtlc(order);

      // Phase 2: Wait for BTC confirmation
      console.log('📝 Phase 2: Waiting for BTC confirmation...');
      await this.btcProvider.waitForTxConfirmation(btcTxHash);

      // Phase 3: Create EVM escrow
      console.log('📝 Phase 3: Creating EVM escrow...');
      const evmTxHash = await this.createEvmEscrow(order);

      // Phase 4: User claims EVM tokens
      console.log('📝 Phase 4: User claims EVM tokens...');
      const claimTxHash = await this.claimEvm(order);

      // Phase 5: Resolver claims BTC
      console.log('📝 Phase 5: Resolver claims BTC...');
      const resolverClaimTxHash = await this.resolverClaimBtc(order);

      return {
        phase: 'completed',
        message: 'Swap completed successfully',
        txHashes: {
          evm: claimTxHash,
          btc: resolverClaimTxHash
        }
      };

    } catch (error) {
      console.error('❌ Swap failed:', error);
      return {
        phase: 'failed',
        message: `Swap failed: ${error}`
      };
    }
  }

  private async createAndFundBtcHtlc(order: SwapOrder): Promise<string> {
    if (!this.config.btcPrivateKey) {
      throw new Error('BTC private key is required for BTC to EVM swaps');
    }
    const btcUser = walletFromPrivateKey(this.config.btcPrivateKey, bitcoin.networks.testnet);
    const btcResolver = walletFromPrivateKey(
      'cUJ4wz3dLzT8v2ZxKtRpU7qyXZ6E1qur87LGCGMehYTkWHnQTMeD', // Resolver private key
      bitcoin.networks.testnet
    );

    // Create HTLC script
    const htlcScript = createSrcHtlcScript(
      order.orderHash,
      order.hashLock.sha256,
      512, // 512 seconds timelock (multiple of 512)
      1024, // 1024 seconds cancellation (multiple of 512)
      btcUser.publicKey,
      btcResolver.publicKey,
      false // Disable lock till private withdrawal for demo
    );

    // Create P2SH address
    const p2sh = bitcoin.payments.p2sh({
      redeem: { output: htlcScript, network: bitcoin.networks.testnet },
      network: bitcoin.networks.testnet
    });

    console.log('🧾 HTLC Address:', p2sh.address);

    // Get user's UTXOs
    const utxos = await this.btcProvider.getUtxos(btcUser.address);
    if (utxos.length === 0) {
      throw new Error('No UTXOs available in user wallet');
    }

    // Create funding transaction
    const psbt = new bitcoin.Psbt({ network: bitcoin.networks.testnet });
    
    // Add inputs
    for (const utxo of utxos) {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: bitcoin.payments.p2wpkh({ pubkey: btcUser.publicKey, network: bitcoin.networks.testnet }).output!,
          value: utxo.value
        }
      });
    }

    // Add HTLC output
    // Convert wei to satoshis (1 ETH = 10^18 wei, 1 BTC = 10^8 satoshis)
    // For demo purposes, use a reasonable amount in satoshis
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
        address: btcUser.address,
        value: change
      });
    }

    // Sign inputs
    for (let i = 0; i < utxos.length; i++) {
      psbt.signInput(i, btcUser.keyPair);
    }

    psbt.finalizeAllInputs();
    const txHex = psbt.extractTransaction().toHex();

    // Broadcast transaction
    const txHash = await this.btcProvider.broadcastTx(txHex);
    console.log('✅ BTC HTLC funded:', txHash);

    return txHash;
  }

  private async createEvmEscrow(order: SwapOrder): Promise<string> {
    const wallet = this.evmWallet.getWallet();
    
    // Check balance
    const balance = await this.evmWallet.getBalance();
    if (balance < order.takingAmount) {
      throw new Error('Insufficient ETH balance for resolver');
    }

    // For simplicity, we'll use a mock escrow creation
    // In a real implementation, you'd interact with the actual escrow factory
    console.log('💰 Creating EVM escrow with', order.takingAmount.toString(), 'wei');
    
    // Simulate escrow creation (replace with actual contract call)
    return '0x' + randomBytes(32).toString('hex');
  }

  private async claimEvm(order: SwapOrder): Promise<string> {
    console.log('🔓 User claiming EVM tokens...');
    
    // In a real implementation, this would call the escrow contract's withdraw function
    // with the secret to claim the tokens
    const mockTxHash = '0x' + randomBytes(32).toString('hex');
    console.log('✅ EVM tokens claimed:', mockTxHash);
    
    return mockTxHash;
  }

  private async resolverClaimBtc(order: SwapOrder): Promise<string> {
    const btcResolver = walletFromPrivateKey(
      'cUJ4wz3dLzT8v2ZxKtRpU7qyXZ6E1qur87LGCGMehYTkWHnQTMeD',
      bitcoin.networks.testnet
    );

    // Get HTLC UTXOs
    const htlcAddress = this.getHtlcAddress(order);
    const utxos = await this.btcProvider.getUtxos(htlcAddress);
    
    if (utxos.length === 0) {
      throw new Error('No UTXOs found at HTLC address');
    }

    const htlcUtxo = utxos[0];
    
    // Create spending transaction
    const psbt = new bitcoin.Psbt({ network: bitcoin.networks.testnet });
    
    // Handle mock mode for resolver claiming
    if (this.btcProvider.isMockMode()) {
      // For mock mode, use simplified approach
      psbt.addInput({
        hash: htlcUtxo.txid,
        index: htlcUtxo.vout,
        redeemScript: this.getHtlcScript(order),
        sequence: 0x10000000
      });
      console.log('🔧 Mock mode: Using simplified P2SH input for resolver claiming');
    } else {
      const rawTxHex = await this.btcProvider.getRawTransactionHex(htlcUtxo.txid);
      psbt.addInput({
        hash: htlcUtxo.txid,
        index: htlcUtxo.vout,
        nonWitnessUtxo: Buffer.from(rawTxHex, 'hex'),
        redeemScript: this.getHtlcScript(order)
      });
    }

    const fee = 1000;
    const redeemValue = htlcUtxo.value - fee;
    
    psbt.addOutput({
      address: btcResolver.address,
      value: redeemValue
    });

    // Sign with resolver's key
    if (this.btcProvider.isMockMode()) {
      // For mock mode, simulate successful signing
      console.log('🔧 Mock mode: Simulating successful resolver BTC claim signing');
    } else {
      psbt.signInput(0, btcResolver.keyPair);

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
    }

    let finalTxHex: string;
    if (this.btcProvider.isMockMode()) {
      // For mock mode, create a mock transaction hex
      finalTxHex = '02000000011234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef000000006a47304402201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef02201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef0121021234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefffffffff0128230000000000001600141234567890abcdef1234567890abcdef123456789000000000';
      console.log('🔧 Mock mode: Using mock transaction hex for resolver BTC claim');
    } else {
      finalTxHex = psbt.extractTransaction().toHex();
    }
    
    const txHash = await this.btcProvider.broadcastTx(finalTxHex);

    console.log('✅ Resolver claimed BTC:', txHash);
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
    if (!this.config.btcPrivateKey) {
      throw new Error('BTC private key is required for BTC to EVM swaps');
    }
    const btcUser = walletFromPrivateKey(this.config.btcPrivateKey, bitcoin.networks.testnet);
    const btcResolver = walletFromPrivateKey(
      'cUJ4wz3dLzT8v2ZxKtRpU7qyXZ6E1qur87LGCGMehYTkWHnQTMeD',
      bitcoin.networks.testnet
    );

    return createSrcHtlcScript(
      order.orderHash,
      order.hashLock.sha256,
      512,
      1024,
      btcUser.publicKey,
      btcResolver.publicKey,
      false
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
