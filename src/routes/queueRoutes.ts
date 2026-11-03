/**
 * OptiGreen Queue & Dispatch Routes
 */

import { Router } from 'express';
import {
  getQueue,
  enqueueWorkload,
  deployWorkload,
  cancelWorkload,
  updateThreshold,
  triggerEventBridge
} from '../controllers/queueController';
import { verifyWebhookSignature, requireAdminAuth } from '../middleware/securityMiddleware';

const router = Router();

router.get('/queue', getQueue);
router.post('/queue/enqueue', verifyWebhookSignature, enqueueWorkload);
router.post('/queue/deploy', requireAdminAuth, deployWorkload);
router.delete('/queue/:id', requireAdminAuth, cancelWorkload);
router.post('/settings/threshold', requireAdminAuth, updateThreshold);
router.post('/eventbridge/trigger', requireAdminAuth, triggerEventBridge);

export default router;
