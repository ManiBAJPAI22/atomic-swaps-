import { ethers } from 'ethers';
import { deployAutoPay } from '../../../scripts/deploy-autopay';
import { AutoPayManager } from '../../../src/evm/autopay-manager';

export class AutoPayService {
  private activeAutoPays: Map<string, any> = new Map();
  private rpcUrl = 'https://eth-sepolia.g.alchemy.com/v2/CQENf_IMmkawSrqgpR14l';
  private pyusdAddress = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';
  private ownerPrivateKey = '4a174f09cb14c06e2c21ea76afaa82a44ead86ca3d18110f87869c078d0bc559';

  async setupAutoPay(config: any, makerAddress: string): Promise<any> {
    try {
      const paymentAmount = ethers.parseUnits(config.paymentAmount, 6);
      const paymentInterval = config.paymentInterval * 60; // Convert to seconds
      const totalDuration = config.totalDuration * 60; // Convert to seconds

      // Deploy AutoPay contract
      const contractAddress = await deployAutoPay(
        config.merchantAddress,
        paymentAmount,
        paymentInterval,
        totalDuration
      );

      if (!contractAddress) {
        throw new Error('Failed to deploy AutoPay contract');
      }

      const autoPayId = `autopay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const autoPayData = {
        id: autoPayId,
        contractAddress,
        makerAddress,
        config: {
          ...config,
          totalPayments: config.totalPayments,
          totalCost: config.totalCost,
        },
        status: 'deployed',
        createdAt: new Date().toISOString(),
        startedAt: '',
      };

      this.activeAutoPays.set(autoPayId, autoPayData);

      // Start AutoPay
      const autoPayManager = new AutoPayManager(
        this.rpcUrl,
        this.ownerPrivateKey,
        contractAddress,
        this.pyusdAddress
      );

      await autoPayManager.startAutoPay();

      autoPayData.status = 'active';
      autoPayData.startedAt = new Date().toISOString();

      return {
        autoPayId,
        contractAddress,
        config: autoPayData.config,
      };
    } catch (error: any) {
      throw new Error(`Failed to setup AutoPay: ${error.message}`);
    }
  }

  async stopAutoPay(contractAddress: string): Promise<void> {
    try {
      const autoPayManager = new AutoPayManager(
        this.rpcUrl,
        this.ownerPrivateKey,
        contractAddress,
        this.pyusdAddress
      );

      await autoPayManager.stopAutoPay();

      // Update status in memory
      for (const [id, autoPay] of this.activeAutoPays.entries()) {
        if (autoPay.contractAddress === contractAddress) {
          autoPay.status = 'stopped';
          autoPay.stoppedAt = new Date().toISOString();
          break;
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to stop AutoPay: ${error.message}`);
    }
  }

  async getAutoPayInfo(contractAddress: string): Promise<any> {
    try {
      const autoPayManager = new AutoPayManager(
        this.rpcUrl,
        this.ownerPrivateKey,
        contractAddress,
        this.pyusdAddress
      );

      const info = await autoPayManager.getAutoPayInfo();
      return {
        ...info,
        nextPaymentTime: info.lastPaymentTime + info.paymentInterval,
        timeRemaining: Number(info.startTime) + Number(info.totalDuration) - Math.floor(Date.now() / 1000),
      };
    } catch (error: any) {
      throw new Error(`Failed to get AutoPay info: ${error.message}`);
    }
  }

  getAutoPay(autoPayId: string): any {
    return this.activeAutoPays.get(autoPayId);
  }

  getAllAutoPays(): any[] {
    return Array.from(this.activeAutoPays.values());
  }
}
