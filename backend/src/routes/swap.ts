import { Router } from 'express';
import { SwapService } from '../services/SwapService';

export function swapRoutes(swapService: SwapService) {
  const router = Router();

  // Start a new swap
  router.post('/start', async (req, res) => {
    try {
      const { btcAddress, makerAddress } = req.body;
      
      if (!btcAddress || !makerAddress) {
        return res.status(400).json({ error: 'BTC address and maker address are required' });
      }

      const result = await swapService.startSwap(btcAddress, makerAddress);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check HTLC funding status
  router.get('/check-funding/:htlcAddress', async (req, res) => {
    try {
      const { htlcAddress } = req.params;
      const result = await swapService.checkHtlcFunding(htlcAddress);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Execute swap (after HTLC is funded)
  router.post('/execute/:swapId', async (req, res) => {
    try {
      const { swapId } = req.params;
      const result = await swapService.executeSwap(swapId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get swap status
  router.get('/status/:swapId', async (req, res) => {
    try {
      const { swapId } = req.params;
      const swap = swapService.getSwap(swapId);
      
      if (!swap) {
        return res.status(404).json({ error: 'Swap not found' });
      }

      res.json(swap);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all swaps
  router.get('/all', async (req, res) => {
    try {
      const swaps = swapService.getAllSwaps();
      res.json(swaps);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
