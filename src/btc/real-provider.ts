import axios, { AxiosInstance } from 'axios';

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
}

export interface TransactionStatus {
  confirmed: boolean;
  block_height?: number;
  block_time?: number;
}

export class RealBtcProvider {
  private api: AxiosInstance;
  private network: string;

  constructor(apiBase: string, network: string = 'testnet') {
    this.network = network;
    this.api = axios.create({
      baseURL: apiBase,
      timeout: 60000, // Increase timeout to 60 seconds
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getUtxos(address: string): Promise<UTXO[]> {
    try {
      console.log(`🔍 Fetching UTXOs for address: ${address}`);
      const res = await this.api.get(`/address/${address}/utxo`);
      
      const utxos = res.data.map((o: any) => ({
        txid: o.txid,
        vout: o.vout,
        value: o.value
      }));

      console.log(`✅ Found ${utxos.length} UTXOs for ${address}`);
      return utxos;
    } catch (error: any) {
      console.error(`❌ Error fetching UTXOs for ${address}:`, error.message);
      throw new Error(`Failed to fetch UTXOs: ${error.message}`);
    }
  }

  async getBalance(address: string): Promise<number> {
    try {
      const utxos = await this.getUtxos(address);
      const balance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
      console.log(`💰 Balance for ${address}: ${balance} satoshis (${balance / 100000000} BTC)`);
      return balance;
    } catch (error: any) {
      console.error(`❌ Error getting balance for ${address}:`, error.message);
      throw error;
    }
  }

  async broadcastTx(txHex: string): Promise<string> {
    try {
      console.log(`📡 Broadcasting transaction: ${txHex.substring(0, 20)}...`);
      const res = await this.api.post('/tx', txHex, {
        headers: { 'Content-Type': 'text/plain' }
      });
      
      const txHash = res.data;
      console.log(`✅ Transaction broadcasted successfully: ${txHash}`);
      return txHash;
    } catch (error: any) {
      console.error(`❌ Error broadcasting transaction:`, error.message);
      if (error.response) {
        console.error(`Response data:`, error.response.data);
      }
      throw new Error(`Failed to broadcast transaction: ${error.message}`);
    }
  }

  async getTransactionStatus(txid: string): Promise<TransactionStatus> {
    try {
      const res = await this.api.get(`/tx/${txid}`);
      const tx = res.data;
      
      return {
        confirmed: tx.status?.confirmed || false,
        block_height: tx.status?.block_height,
        block_time: tx.status?.block_time
      };
    } catch (error: any) {
      console.error(`❌ Error getting transaction status for ${txid}:`, error.message);
      return { confirmed: false };
    }
  }

  async waitForTxConfirmation(
    txid: string,
    timeoutMs = 300_000
  ): Promise<{ confirmedAt: string; blockHeight: number }> {
    console.log(`⏳ Waiting for transaction confirmation: ${txid}`);
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      try {
        const status = await this.getTransactionStatus(txid);

        if (status.confirmed) {
          const confirmedAt = new Date(status.block_time! * 1000).toISOString();
          const blockHeight = status.block_height!;

          console.log(`✅ TX ${txid} confirmed in block ${blockHeight} at ${confirmedAt}`);
          return { confirmedAt, blockHeight };
        }

        console.log(`⏳ Waiting for TX ${txid} confirmation... (${Math.floor((Date.now() - start) / 1000)}s elapsed)`);
      } catch (err: any) {
        console.warn(`⚠️ Error fetching TX ${txid}:`, err.message);
      }

      await this.delay(10000); // Check every 10 seconds
    }

    throw new Error(`❌ Transaction ${txid} not confirmed within ${timeoutMs / 1000} seconds.`);
  }

  async waitForUtxo(address: string, timeoutMs = 60000): Promise<UTXO[]> {
    console.log(`⏳ Waiting for UTXOs at address: ${address}`);
    const start = Date.now();
    
    while (Date.now() - start < timeoutMs) {
      try {
        const utxos = await this.getUtxos(address);
        if (utxos.length > 0) {
          console.log(`✅ Found ${utxos.length} UTXOs at ${address}`);
          return utxos;
        }
      } catch (error) {
        console.warn(`⚠️ Error checking for UTXOs:`, error);
      }
      
      await this.delay(5000); // Check every 5 seconds
    }
    
    throw new Error(`❌ No UTXOs found for ${address} after ${timeoutMs / 1000} seconds.`);
  }

  async getUtxosFromTxid(txid: string): Promise<UTXO[]> {
    try {
      const tx = await this.api.get(`/tx/${txid}`).then((res) => res.data);
      const utxos: UTXO[] = [];

      for (let i = 0; i < tx.vout.length; i++) {
        const outspend = await this.api.get(`/tx/${txid}/outspend/${i}`).then((res) => res.data);

        if (!outspend.spent) {
          utxos.push({
            txid,
            vout: i,
            value: tx.vout[i].value
          });
        }
      }

      return utxos;
    } catch (error: any) {
      console.error(`❌ Error getting UTXOs from txid ${txid}:`, error.message);
      throw error;
    }
  }

  async getRawTransactionHex(txid: string): Promise<string> {
    try {
      console.log(`🔍 Fetching raw transaction hex for: ${txid}`);
      const res = await this.api.get(`/tx/${txid}/hex`);
      return res.data;
    } catch (error: any) {
      console.error(`❌ Error getting raw transaction hex for ${txid}:`, error.message);
      throw error;
    }
  }

  async verifyHTLCScriptHashFromTx(txid: string, htlcScript: Buffer): Promise<void> {
    const bitcoin = require('bitcoinjs-lib');
    const scriptHash = bitcoin.crypto.hash160(htlcScript);

    try {
      const txHex = await this.getRawTransactionHex(txid);
      const tx = bitcoin.Transaction.fromHex(txHex);

      const expectedOutputScript = bitcoin.script.compile([
        bitcoin.opcodes.OP_HASH160,
        scriptHash,
        bitcoin.opcodes.OP_EQUAL
      ]);

      const match = tx.outs.find((out: any) => out.script.equals(expectedOutputScript));

      if (match) {
        console.log('✅ HTLC script hash verified on-chain!');
      } else {
        console.error('❌ HTLC script hash mismatch. Script may not be correct.');
        throw new Error('HTLC script hash verification failed');
      }
    } catch (error: any) {
      console.error(`❌ Error verifying HTLC script hash:`, error.message);
      throw error;
    }
  }

  // Helper method to check if we're connected to the network
  async checkConnection(): Promise<boolean> {
    try {
      await this.api.get('/blocks/tip/height');
      console.log('✅ Connected to Bitcoin testnet');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Bitcoin testnet');
      return false;
    }
  }
}
