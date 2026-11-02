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

const router = Router();

router.get('/queue', getQueue);
router.post('/queue/enqueue', enqueueWorkload);
router.post('/queue/deploy', deployWorkload);
router.delete('/queue/:id', cancelWorkload);
router.post('/settings/threshold', updateThreshold);
router.post('/eventbridge/trigger', triggerEventBridge);

export default router;
