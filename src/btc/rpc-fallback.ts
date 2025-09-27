import { BtcProvider } from './provider';

export class BtcRpcFallback {
  private rpcEndpoints: string[] = [
    'https://blockstream.info/testnet/api',
    'https://mempool.space/testnet/api',
    'https://api.blockcypher.com/v1/btc/test3',
    'https://btc.com/testnet/api'
  ];

  private currentEndpointIndex: number = 0;

  /**
   * Try multiple RPC endpoints until one works
   */
  public async getWorkingProvider(): Promise<BtcProvider> {
    for (let i = 0; i < this.rpcEndpoints.length; i++) {
      const endpoint = this.rpcEndpoints[this.currentEndpointIndex];
      console.log(`🔍 Trying Bitcoin RPC: ${endpoint}`);
      
      try {
        const provider = new BtcProvider(endpoint, 'testnet', false);
        
        // Test the provider with a simple call
        await provider.getUtxos('tb1qc8whyxx6x637j6328weljzw4clgq9sffcu5c43');
        
        console.log(`✅ Bitcoin RPC working: ${endpoint}`);
        return provider;
        
      } catch (error: any) {
        console.log(`❌ RPC failed: ${endpoint} - ${error.message}`);
        this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.rpcEndpoints.length;
      }
    }

    // If all RPC endpoints fail, return mock provider
    console.log('⚠️  All Bitcoin RPC endpoints failed, using mock mode');
    return new BtcProvider('https://mock.btc.api', 'testnet', true);
  }

  /**
   * Get current endpoint
   */
  public getCurrentEndpoint(): string {
    return this.rpcEndpoints[this.currentEndpointIndex];
  }

  /**
   * Rotate to next endpoint
   */
  public rotateEndpoint(): void {
    this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.rpcEndpoints.length;
  }
}
