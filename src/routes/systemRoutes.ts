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
  simulateFailure,
  getRunnerExecutions,
  getRunnerExecutionById,
  executeDemoRun,
  getGeminiStatus
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

// Gemini AI Runtime & Runner Execution Transparency Endpoints
router.get('/gemini/status', getGeminiStatus);
router.get('/runner/executions', getRunnerExecutions);
router.get('/runner/execution/:id', getRunnerExecutionById);
router.post('/runner/execute-demo', executeDemoRun);

export default router;
