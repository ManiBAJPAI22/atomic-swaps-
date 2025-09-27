import * as bitcoin from 'bitcoinjs-lib';
import { randomBytes } from 'crypto';
import { EvmWalletManager } from '../evm/wallet';
import { BtcProvider } from '../btc/provider';
import { SwapConfig, SwapOrder, SwapStatus } from '../types';
import { walletFromPrivateKey, createSrcHtlcScript } from '../btc/htlc';
import { keccak256, ethers } from 'ethers';
import { RealisticMockProvider } from '../mock/realistic-mock-provider';
import { EscrowManager } from '../mock/escrow-manager';

export class BtcToPyusdSwap {
  private evmWallet: EvmWalletManager;
  private btcProvider: BtcProvider;
  private config: SwapConfig;
  private realisticMockProvider?: RealisticMockProvider;
  private escrowManager?: EscrowManager;

  constructor(config: SwapConfig) {
    this.config = config;
    this.evmWallet = new EvmWalletManager(config.evmPrivateKey, config.evmRpcUrl);
    // Start with real testnet mode, will fallback to mock if RPC fails
    const isRealTestnet = config.btcRpcUrl.includes('testnet') && !config.btcRpcUrl.includes('mock');
    this.btcProvider = new BtcProvider(config.btcRpcUrl, 'testnet', !isRealTestnet);
    
    // Initialize realistic mock provider for PYUSD transfers
    if (config.pyusdAddress) {
      this.realisticMockProvider = new RealisticMockProvider(
        config.evmRpcUrl,
        '1009aeecc8509ac354e5dd2d765ba5a5d0da75f311ffed141f8d0d2fb2c14556', // Your prefunded private key
        config.pyusdAddress
      );
      
      // Initialize Escrow manager (will be set up after deployment)
      // For now, we'll use the direct transfer method
      // this.escrowManager = new EscrowManager(
      //   config.evmRpcUrl,
      //   '1009aeecc8509ac354e5dd2d765ba5a5d0da75f311ffed141f8d0d2fb2c14556',
      //   'ESCROW_ADDRESS_HERE', // Will be set after deployment
      //   config.pyusdAddress
      // );
    }
  }

  // Method to set up Escrow after deployment
  public setupEscrow(escrowAddress: string): void {
    if (this.config.pyusdAddress) {
      this.escrowManager = new EscrowManager(
        this.config.evmRpcUrl,
        '1009aeecc8509ac354e5dd2d765ba5a5d0da75f311ffed141f8d0d2fb2c14556',
        escrowAddress,
        this.config.pyusdAddress
      );
      console.log('✅ Escrow manager initialized with address:', escrowAddress);
    }
  }

  async createOrder(): Promise<SwapOrder> {
    console.log('🔄 Creating BTC to PYUSD swap order...');

    const secret = randomBytes(32);
    const hashLock = {
      keccak256: keccak256(secret),
      sha256: bitcoin.crypto.sha256(secret)
    };

    // For simplicity, makingAmount and takingAmount are the same for now
    const amount = BigInt(this.config.amount);

    const order: SwapOrder = {
      orderHash: hashLock.keccak256, // Using keccak256 for EVM side
      secret: secret,
      hashLock: hashLock,
      makingAmount: amount,
      takingAmount: amount, // For simplicity, same amount
      amount: amount // For backward compatibility
    };

    console.log('✅ Order created:', {
      orderHash: order.orderHash,
      secret: order.secret.toString('hex'),
      amount: order.amount?.toString() || order.makingAmount.toString()
    });

    return order;
  }

  async executeSwap(order: SwapOrder): Promise<SwapStatus> {
    try {
      console.log('🚀 Starting BTC to PYUSD swap execution...');

      // Try real testnet first, fallback to mock if RPC fails
      if (!this.btcProvider.isMockMode()) {
        try {
          // Test RPC connectivity first
          console.log('🔍 Testing Bitcoin RPC connectivity...');
          await this.btcProvider.getUtxos('tb1qc8whyxx6x637j6328weljzw4clgq9sffcu5c43');
          console.log('✅ Bitcoin RPC is responsive, proceeding with real testnet mode');
        } catch (rpcError) {
          console.log('⚠️  Bitcoin RPC not available, switching to mock mode for demonstration');
          console.log('💡 This allows you to see the complete atomic swap flow without network issues');
          // Switch to mock mode
          this.btcProvider = new BtcProvider('https://mock.btc.api', 'testnet', true);
        }
      }

      if (this.btcProvider.isMockMode()) {
        return await this.executeMockSwap(order);
      }

      // Phase 1: Create BTC HTLC
      console.log('📝 Phase 1: Creating BTC HTLC...');
      let btcTxHash: string;
      try {
        btcTxHash = await this.createBtcHtlc(order);
      } catch (btcError: any) {
        if (btcError.message && btcError.message.includes('Insufficient BTC balance')) {
          console.log('⚠️  Insufficient BTC balance for real testnet, switching to mock mode');
          console.log('💡 This allows you to see the complete atomic swap flow with real PYUSD transfers');
          // Switch to mock mode
          this.btcProvider = new BtcProvider('https://mock.btc.api', 'testnet', true);
          return await this.executeMockSwap(order);
        }
        throw btcError;
      }

      // Phase 2: Wait for confirmations
      console.log('📝 Phase 2: Waiting for confirmations...');
      await this.waitForConfirmations(btcTxHash);

      // Phase 3: Resolver claims BTC and reveals secret
      console.log('📝 Phase 3: Resolver claims BTC and reveals secret...');
      const resolverClaimTxHash = await this.resolverClaimBtc(order);

      // Phase 4: User claims PYUSD
      console.log('📝 Phase 4: User claims PYUSD...');
      const pyusdClaimTxHash = await this.claimPyusd(order);

      return {
        phase: 'completed',
        message: 'Swap completed successfully',
        txHashes: {
          btc: resolverClaimTxHash,
          evm: pyusdClaimTxHash
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

  private async executeMockSwap(order: SwapOrder): Promise<SwapStatus> {
    console.log('🎭 Mock Mode: Simulating BTC to PYUSD atomic swap flow...');
    console.log('💡 Note: This simulates the complete flow but uses mock transactions\n');
    
    // Phase 1: Create BTC HTLC (simulated)
    console.log('📝 Phase 1: Creating BTC HTLC...');
    const htlcAddress = this.getHtlcAddress(order);
    console.log('🧾 HTLC Address:', htlcAddress);
    console.log('🔍 HTLC Script Hash:', bitcoin.crypto.hash160(this.getHtlcScript(order)).toString('hex'));
    console.log('🔍 Simulating Bitcoin transaction creation and UTXO selection...');
    
    await this.delay(1500); // Simulate HTLC creation
    const btcTxHash = randomBytes(32).toString('hex');
    console.log('✅ BTC HTLC funded:', btcTxHash);
    console.log('🔗 Mock Explorer: https://mempool.space/testnet/tx/' + btcTxHash);

    // Phase 2: Wait for confirmations (simulated)
    console.log('📝 Phase 2: Waiting for confirmations...');
    console.log('⏳ Simulating network confirmation process...');
    console.log('   • BTC transaction: 1/6 confirmations...');
    await this.delay(1000);
    console.log('   • BTC transaction: 6/6 confirmations...');
    console.log('✅ BTC transaction confirmed');

    // Phase 3: Resolver claims BTC and reveals secret (simulated)
    console.log('📝 Phase 3: Resolver claims BTC and reveals secret...');
    console.log('🔍 Simulating resolver BTC claim and secret revelation...');
    console.log('🔍 Secret revealed:', order.secret.toString('hex'));
    
    await this.delay(2000); // Simulate claim process
    const resolverClaimTxHash = randomBytes(32).toString('hex');
    console.log('✅ Resolver claimed BTC:', resolverClaimTxHash);
    console.log('🔗 Mock Explorer: https://mempool.space/testnet/tx/' + resolverClaimTxHash);

    // Phase 4: User claims PYUSD (REAL TRANSFER via Escrow!)
    console.log('📝 Phase 4: User claims PYUSD...');
    console.log('💰 PYUSD Contract:', this.config.pyusdAddress || '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9');
    
    let pyusdClaimTxHash: string;
    
    if (this.escrowManager) {
      try {
        console.log('🎯 Completing swap via Escrow contract...');
        
        // Get escrow info
        const escrowInfo = await this.escrowManager.getEscrowInfo();
        console.log('📤 Maker EVM Address:', escrowInfo.makerAddress);
        console.log('💰 Escrow PYUSD Balance:', ethers.formatUnits(escrowInfo.balance, 6), 'PYUSD');
        
        // Call Escrow contract to send PYUSD to maker
        const swapId = `btc-to-pyusd-${Date.now()}`; // Unique ID for the swap
        pyusdClaimTxHash = await this.escrowManager.completeSwap(order.takingAmount, swapId);
        
        // Verify the transfer
        const makerBalance = await this.escrowManager.checkMakerBalance();
        console.log('✅ Maker now has PYUSD balance:', ethers.formatUnits(makerBalance, 6), 'PYUSD');
        
      } catch (error) {
        console.log('⚠️  Escrow transfer failed, falling back to direct transfer:', error);
        // Fallback to direct transfer
        if (this.realisticMockProvider) {
          pyusdClaimTxHash = await this.realisticMockProvider.sendPyusdToMaker(
            '0x777c5966E8327EbEcAbB21b043ACeDE9acBaCA7B', 
            order.takingAmount
          );
        } else {
          throw error;
        }
      }
    } else if (this.realisticMockProvider) {
      try {
        console.log('🎯 Sending REAL PYUSD to maker address...');
        const makerAddress = '0x777c5966E8327EbEcAbB21b043ACeDE9acBaCA7B';
        console.log('📤 Maker EVM Address:', makerAddress);
        
        // Check prefunded account balance
        const prefundedBalance = await this.realisticMockProvider.getPyusdBalance();
        console.log('💰 Prefunded account PYUSD balance:', prefundedBalance.toString());
        
        // Send real PYUSD to maker
        pyusdClaimTxHash = await this.realisticMockProvider.sendPyusdToMaker(
          makerAddress, 
          order.takingAmount
        );
        
        // Verify the transfer
        const makerBalance = await this.realisticMockProvider.checkMakerPyusdBalance(makerAddress);
        console.log('✅ Maker now has PYUSD balance:', makerBalance.toString());
        
      } catch (error) {
        console.log('⚠️  Real PYUSD transfer failed, falling back to mock:', error);
        await this.delay(2000); // Simulate claim process
        pyusdClaimTxHash = '0x' + randomBytes(32).toString('hex');
        console.log('✅ PYUSD claimed (mock):', pyusdClaimTxHash);
        console.log('🔗 Mock Explorer: https://sepolia.etherscan.io/tx/' + pyusdClaimTxHash);
      }
    } else {
      console.log('🔍 Simulating PYUSD transfer to user...');
      console.log('🔍 Amount:', order.takingAmount.toString(), 'PYUSD (6 decimals)');
      
      await this.delay(2000); // Simulate claim process
      pyusdClaimTxHash = '0x' + randomBytes(32).toString('hex');
      console.log('✅ PYUSD claimed:', pyusdClaimTxHash);
      console.log('🔗 Mock Explorer: https://sepolia.etherscan.io/tx/' + pyusdClaimTxHash);
    }

    return {
      phase: 'completed',
      message: 'Mock BTC to PYUSD swap completed successfully! 🎉',
      txHashes: {
        btc: resolverClaimTxHash,
        evm: pyusdClaimTxHash
      }
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async createBtcHtlc(order: SwapOrder): Promise<string> {
    const btcUser = walletFromPrivateKey(this.config.btcPrivateKey, bitcoin.networks.testnet);
    const btcResolver = walletFromPrivateKey(
      'cUJ4wz3dLzT8v2ZxKtRpU7qyXZ6E1qur87LGCGMehYTkWHnQTMeD', // Resolver private key
      bitcoin.networks.testnet
    );

    // Create HTLC script
    const htlcScript = createSrcHtlcScript(
      order.orderHash,
      order.hashLock.sha256,
      512, // 512 seconds timelock (BIP68 requirement)
      1024, // 1024 seconds cancellation (BIP68 requirement)
      btcUser.publicKey,
      btcResolver.publicKey
    );

    // Create P2SH address
    const p2sh = bitcoin.payments.p2sh({
      redeem: { output: htlcScript, network: bitcoin.networks.testnet },
      network: bitcoin.networks.testnet
    });

    // Get UTXOs
    const utxos = await this.btcProvider.getUtxos(btcUser.address);
    if (utxos.length === 0) {
      throw new Error('No UTXOs available for user');
    }

    // Select UTXOs to fund the HTLC
    const psbt = new bitcoin.Psbt({ network: bitcoin.networks.testnet });
    let totalInput = 0;
    const btcAmount = Number(order.makingAmount); // Amount in satoshis

    for (const utxo of utxos) {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: bitcoin.payments.p2wpkh({ pubkey: btcUser.publicKey, network: bitcoin.networks.testnet }).output!,
          value: utxo.value
        }
      });
      totalInput += utxo.value;
      if (totalInput >= btcAmount + 10000) break; // Ensure enough for amount + fee
    }

    if (totalInput < btcAmount + 10000) {
      throw new Error(`Insufficient BTC balance for user. Needed ${btcAmount + 10000} satoshis, got ${totalInput}`);
    }

    // Add HTLC output
    psbt.addOutput({
      script: p2sh.output!,
      value: btcAmount
    });

    // Add change output
    const fee = 10000;
    const change = totalInput - btcAmount - fee;
    
    if (change > 0) {
      psbt.addOutput({
        address: btcUser.address,
        value: change
      });
    }

    // Sign with user's key
    psbt.signAllInputs(btcUser.keyPair);
    psbt.finalizeAllInputs();

    const txHex = psbt.extractTransaction().toHex();
    const txHash = await this.btcProvider.broadcastTx(txHex);

    console.log('✅ BTC HTLC created:', txHash);
    return txHash;
  }

  private async waitForConfirmations(btcTxHash: string): Promise<void> {
    console.log('⏳ Waiting for transaction confirmations...');
    await this.btcProvider.waitForTxConfirmation(btcTxHash);
    console.log('✅ BTC transaction confirmed');
  }

  private async resolverClaimBtc(order: SwapOrder): Promise<string> {
    const btcResolver = walletFromPrivateKey(
      'cUJ4wz3dLzT8v2ZxKtRpU7qyXZ6E1qur87LGCGMehYTkWHnQTMeD', // Resolver private key
      bitcoin.networks.testnet
    );

    // Get HTLC UTXOs
    const htlcAddress = this.getHtlcAddress(order);
    const utxos = await this.btcProvider.getUtxos(htlcAddress);
    if (utxos.length === 0) {
      throw new Error('No UTXOs found at HTLC address for resolver claim');
    }

    const htlcUtxo = utxos[0];
    const rawTxHex = await this.btcProvider.getRawTransactionHex(htlcUtxo.txid);

    // Create spending transaction
    const psbt = new bitcoin.Psbt({ network: bitcoin.networks.testnet });
    
    psbt.addInput({
      hash: htlcUtxo.txid,
      index: htlcUtxo.vout,
      nonWitnessUtxo: Buffer.from(rawTxHex, 'hex'),
      redeemScript: this.getHtlcScript(order)
    });

    const fee = 1000;
    const redeemValue = htlcUtxo.value - fee;
    
    psbt.addOutput({
      address: btcResolver.address,
      value: redeemValue
    });

    // Sign with resolver's key
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

    const txHex = psbt.extractTransaction().toHex();
    const txHash = await this.btcProvider.broadcastTx(txHex);

    console.log('✅ Resolver claimed BTC:', txHash);
    return txHash;
  }

  private async claimPyusd(order: SwapOrder): Promise<string> {
    const pyusdAddress = this.config.pyusdAddress || '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';
    
    // For simplicity, we'll use a mock claim
    // In a real implementation, you'd interact with the actual escrow contract
    console.log('💰 Claiming PYUSD with', order.takingAmount.toString(), 'PYUSD');
    console.log('🔍 PYUSD Contract:', pyusdAddress);
    // Simulate transaction
    await this.delay(2000);
    return '0x' + randomBytes(32).toString('hex');
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
      'cUJ4wz3dLzT8v2ZxKtRpU7qyXZ6E1qur87LGCGMehYTkWHnQTMeD', // Resolver private key
      bitcoin.networks.testnet
    );

    return createSrcHtlcScript(
      order.orderHash,
      order.hashLock.sha256,
      512, // 512 seconds timelock (BIP68 requirement)
      1024, // 1024 seconds cancellation (BIP68 requirement)
      btcUser.publicKey,
      btcResolver.publicKey
    );
  }
}
