 import axios, { AxiosInstance } from 'axios';

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
}

export class BtcProvider {
  private api: AxiosInstance;
  private network: string;
  private mockMode: boolean;

  constructor(apiBase: string, network: string = 'testnet', mockMode: boolean = false) {
    this.network = network;
    this.mockMode = mockMode;
    this.api = axios.create({
      baseURL: apiBase,
      timeout: 30000 // Increase timeout to 30 seconds
    });
  }

  isMockMode(): boolean {
    return this.mockMode;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getUtxos(address: string): Promise<UTXO[]> {
    if (this.mockMode) {
      // Mock UTXOs for testing
      console.log('🔧 Mock mode: Returning mock UTXOs for', address);
      return [
        {
          txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          vout: 0,
          value: 100000 // 0.001 BTC in satoshis
        }
      ];
    }
    
    const res = await this.api.get(`/address/${address}/utxo`);
    return res.data.map((o: any) => ({
      txid: o.txid,
      vout: o.vout,
      value: o.value
    }));
  }

  async getBalance(address: string): Promise<number> {
    const utxos = await this.getUtxos(address);
    return utxos.reduce((sum, utxo) => sum + utxo.value, 0);
  }

  async broadcastTx(txHex: string): Promise<string> {
    if (this.mockMode) {
      // Mock transaction broadcast
      console.log('🔧 Mock mode: Broadcasting transaction');
      return '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    }
    
    const res = await this.api.post('/tx', txHex, {
      headers: { 'Content-Type': 'text/plain' }
    });
    return res.data;
  }

  async waitForTxConfirmation(
    txid: string,
    timeoutMs = 300_000
  ): Promise<{ confirmedAt: string; blockHeight: number }> {
    if (this.mockMode) {
      // Mock transaction confirmation
      console.log('🔧 Mock mode: Transaction confirmed');
      return { confirmedAt: new Date().toISOString(), blockHeight: 123456 };
    }
    
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      try {
        const txData = await this.api.get(`/tx/${txid}`).then((res) => res.data);
        const status = txData.status;

        if (status && status.confirmed) {
          const confirmedAt = status.block_time;
          const blockHeight = status.block_height;

          console.log(`✅ TX ${txid} confirmed in block ${blockHeight} at ${confirmedAt}`);
          return { confirmedAt, blockHeight };
        }

        console.log(`⏳ Waiting for TX ${txid} confirmation...`);
      } catch (err: any) {
        console.warn(`⚠️ Error fetching TX ${txid}:`, err.message);
      }

      await this.delay(5000);
    }

    throw new Error(`❌ Transaction ${txid} not confirmed within ${timeoutMs / 1000} seconds.`);
  }

  async waitForUtxo(address: string, timeoutMs = 10000): Promise<UTXO[]> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const utxos = await this.getUtxos(address);
      if (utxos.length > 0) return utxos;
      await this.delay(1000);
    }
    throw new Error(`UTXOs not found for ${address} after ${timeoutMs}ms`);
  }

  async getUtxosFromTxid(txid: string): Promise<UTXO[]> {
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
  }

  async getRawTransactionHex(txid: string): Promise<string> {
    if (this.mockMode) {
      // Mock raw transaction hex
      console.log('🔧 Mock mode: Returning mock raw transaction hex');
      return '02000000011234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef000000006a47304402201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef02201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef0121021234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefffffffff0128230000000000001600141234567890abcdef1234567890abcdef123456789000000000';
    }
    
    const res = await this.api.get(`/tx/${txid}/hex`);
    return res.data;
  }

  async verifyHTLCScriptHashFromTx(txid: string, htlcScript: Buffer): Promise<void> {
    const bitcoin = require('bitcoinjs-lib');
    const scriptHash = bitcoin.crypto.hash160(htlcScript);

    const txHex = await this.api.get(`/tx/${txid}/hex`).then((res) => res.data);
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
    }
  }
}
