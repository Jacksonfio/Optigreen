/**
 * OptiGreen System Telemetry, Integrations & Interceptor Controller
 * Provides health telemetry, external integrations status, SHA-256 audit ledger,
 * and deployment interceptor error simulation.
 */

import { Request, Response } from 'express';
import { globalDb } from '../services/persistentDatabase';
import { globalGoogleCloud } from '../services/googleCloudClient';
import { globalAuditLedger, CSRD_SCOPE3_CATEGORY } from '../services/auditLedger';
import { getSqsIntegrationStatus } from '../services/awsSqsClient';
import { getCarbonProviderStatus } from '../services/regionalCarbonService';
import { globalDeploymentInterceptor } from '../services/deploymentInterceptor';
import { CODE_DELIVERABLES } from '../data/deliverables';

export function getHealth(req: Request, res: Response): void {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
}

export function getIntegrationsStatus(req: Request, res: Response): void {
  const sqs = getSqsIntegrationStatus();
  const carbonStatus = getCarbonProviderStatus();

  res.json({
    timestamp: new Date().toISOString(),
    awsSqs: sqs,
    carbonTelemetry: carbonStatus,
    electricityMaps: {
      provider: carbonStatus.provider,
      mode: carbonStatus.mode,
      configured: true,
      status: carbonStatus.status,
      source: carbonStatus.source
    },
    gemini: {
      mode: process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' ? 'LIVE' : 'SANDBOX',
      configured: Boolean(process.env.GEMINI_API_KEY),
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    },
    auditLedger: {
      mode: 'LOCAL_SHA256_CHAIN',
      blocks: globalAuditLedger.length
    },
    database: globalDb.getStats(),
    googleCloud: globalGoogleCloud.getStatus()
  });
}

export function getGcpStatus(req: Request, res: Response): void {
  res.json(globalGoogleCloud.getStatus());
}

export function getDatabaseStats(req: Request, res: Response): void {
  res.json(globalDb.getStats());
}

export async function getLedger(req: Request, res: Response): Promise<void> {
  const chain = globalAuditLedger.getChain();
  const verification = await globalAuditLedger.verifyChain();
  res.json({
    chain,
    verification,
    csrdScope3Category: CSRD_SCOPE3_CATEGORY
  });
}

export function getDeliverables(req: Request, res: Response): void {
  res.json(CODE_DELIVERABLES);
}

export function getActivities(req: Request, res: Response): void {
  res.json(globalDb.getActivities());
}

export function getInterceptorStatus(req: Request, res: Response): void {
  res.json({
    metrics: globalDeploymentInterceptor.getMetrics(),
    logs: globalDeploymentInterceptor.getLogs()
  });
}

export function resetCircuit(req: Request, res: Response): void {
  globalDeploymentInterceptor.resetCircuitBreaker();
  res.json({
    success: true,
    metrics: globalDeploymentInterceptor.getMetrics(),
    logs: globalDeploymentInterceptor.getLogs()
  });
}

export async function simulateFailure(req: Request, res: Response): Promise<void> {
  const { failureType, serviceName } = req.body;
  const targetType = failureType || 'SQS_CONNECTION_ERROR';
  const targetService = serviceName || 'us-east-1-sqs-queue';

  const interceptResult = await globalDeploymentInterceptor.executeWithInterceptor(
    async () => {
      return { status: 'DISPATCH_ACK_RECEIVED', sqsMessageId: `msg-sim-${Date.now()}` };
    },
    'SQS_QUEUE',
    targetService,
    targetType
  );

  res.json({
    success: !!interceptResult.result,
    interceptResult,
    metrics: globalDeploymentInterceptor.getMetrics(),
    logs: globalDeploymentInterceptor.getLogs()
  });
}
