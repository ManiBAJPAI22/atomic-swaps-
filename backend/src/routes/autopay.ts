import { Router } from 'express';
import { AutoPayService } from '../services/AutoPayService';

export function autopayRoutes(autoPayService: AutoPayService) {
  const router = Router();

  // Setup AutoPay
  router.post('/setup', async (req, res) => {
    try {
      const { merchantAddress, paymentAmount, paymentInterval, totalDuration, totalPayments, totalCost, makerAddress } = req.body;
      
      if (!merchantAddress || !paymentAmount || !paymentInterval || !totalDuration || !makerAddress) {
        return res.status(400).json({ error: 'All AutoPay parameters are required' });
      }

      const config = {
        merchantAddress,
        paymentAmount,
        paymentInterval,
        totalDuration,
        totalPayments,
        totalCost,
      };

      const result = await autoPayService.setupAutoPay(config, makerAddress);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stop AutoPay
  router.post('/stop', async (req, res) => {
    try {
      const { contractAddress } = req.body;
      
      if (!contractAddress) {
        return res.status(400).json({ error: 'Contract address is required' });
      }

      await autoPayService.stopAutoPay(contractAddress);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get AutoPay info
  router.get('/info/:contractAddress', async (req, res) => {
    try {
      const { contractAddress } = req.params;
      const info = await autoPayService.getAutoPayInfo(contractAddress);
      res.json(info);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get AutoPay by ID
  router.get('/:autoPayId', async (req, res) => {
    try {
      const { autoPayId } = req.params;
      const autoPay = autoPayService.getAutoPay(autoPayId);
      
      if (!autoPay) {
        return res.status(404).json({ error: 'AutoPay not found' });
      }

      res.json(autoPay);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all AutoPays
  router.get('/all', async (req, res) => {
    try {
      const autoPays = autoPayService.getAllAutoPays();
      res.json(autoPays);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
