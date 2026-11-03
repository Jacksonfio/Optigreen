/**
 * OptiGreen System, Infrastructure Telemetry & Interceptor Routes
 */

import { Router } from 'express';
import {
  getHealth,
  getIntegrationsStatus,
  getGcpStatus,
  getDatabaseStats,
  getLedger,
  getDeliverables,
  getActivities,
  getInterceptorStatus,
  resetCircuit,
  simulateFailure
} from '../controllers/systemController';
import { requireAdminAuth } from '../middleware/securityMiddleware';

const router = Router();

router.get('/health', getHealth);
router.get('/integrations/status', getIntegrationsStatus);
router.get('/gcp/status', getGcpStatus);
router.get('/database/stats', getDatabaseStats);
router.get('/ledger', getLedger);
router.get('/deliverables', getDeliverables);
router.get('/activity', getActivities);
router.get('/deployment/interceptor-status', getInterceptorStatus);
router.post('/deployment/reset-circuit', requireAdminAuth, resetCircuit);
router.post('/deployment/simulate-failure', requireAdminAuth, simulateFailure);

export default router;
