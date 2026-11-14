/**
 * OptiGreen Queue Controller
 * Handles queuing, deployment dispatch, cancellation, threshold adjustment,
 * EventBridge triggers, and critical-path Gemini tool-calling candidate rerouting.
 */

import { Request, Response } from 'express';
import { globalDb, PersistentQueueItem } from '../services/persistentDatabase';
import { globalDeploymentInterceptor } from '../services/deploymentInterceptor';
import { globalAuditLedger, CSRD_SCOPE3_CATEGORY } from '../services/auditLedger';
import { globalGoogleCloud } from '../services/googleCloudClient';
import { sendToSqs } from '../services/awsSqsClient';
import { decideDeployment, SlaTier } from '../services/carbonDecisionEngine';
import { getServerSideRegionIntensity } from '../services/regionalCarbonService';
import { proposeCandidateRerouting, generateAiSustainabilityAdvisory, GeminiRerouteProposal } from '../services/geminiService';
import { generateGitHubPrMarkdownComment, generateSlackBlockKitMessage } from '../services/notificationBotService';

export async function getQueue(req: Request, res: Response): Promise<void> {
  const queue = globalDb.getQueue();
  const threshold = globalDb.getSettings().threshold;
  res.json({
    queue,
    threshold,
    totalQueued: queue.length,
    interceptorMetrics: globalDeploymentInterceptor.getMetrics()
  });
}

export async function enqueueWorkload(req: Request, res: Response): Promise<void> {
  const {
    repo,
    name,
    branch,
    commitSha,
    awsRegion,
    carbonIntensity,
    intensityLimit,
    threshold: bodyThreshold,
    commitAuthor,
    slaTier,
    forceSimulatedError,
    includeAiAdvice,
    artifactSizeGb,
    autoReroute
  } = req.body;

  let targetRegion = awsRegion || 'us-east-1';
  const workloadRepo = repo || name || 'new-microservice';

  // Server-Side Telemetry Lookup: Query verified regional carbon intensity
  const telemetry = await getServerSideRegionIntensity(targetRegion);
  let intensity = (typeof carbonIntensity === 'number' && carbonIntensity > 0) ? carbonIntensity : telemetry.intensity;
  
  // Respect client intensityLimit or threshold parameter, fallback to system setting
  const threshold = (typeof intensityLimit === 'number' && intensityLimit > 0) 
    ? intensityLimit 
    : ((typeof bodyThreshold === 'number' && bodyThreshold > 0) ? bodyThreshold : globalDb.getSettings().threshold);

  const tier: SlaTier = slaTier === 'P1_HOTFIX' || slaTier === 'P3_BATCH' ? slaTier : 'P2_FEATURE';
  const now = Date.now();
  const workloadId = `sqs-msg-${now}`;

  // Pillar 4: SLA-tiered carbon-aware baseline decision
  let decision = decideDeployment({ carbonIntensity: intensity, threshold, slaTier: tier, now });
  let isBelow = decision.decision !== 'QUEUE';

  // ---------------------------------------------------------------------------
  // Critical-Path Gemini AI Autonomous Governance & Tool-Calling Loop:
  // When grid emissions exceed threshold, invoke Gemini's multi-turn tool calling
  // (inspectRegionalGridTelemetry, evaluateWanEgressVeto, dispatchWorkloadMigration).
  // Gemini's evaluation directly GOVERNS the scheduling outcome!
  // ---------------------------------------------------------------------------
  let geminiRerouteProposal: GeminiRerouteProposal | null = null;
  if (!isBelow || intensity > threshold || includeAiAdvice) {
    try {
      geminiRerouteProposal = await proposeCandidateRerouting({
        workloadId,
        repo: workloadRepo,
        branch: branch || 'main',
        commitSha: commitSha || Math.random().toString(36).substring(2, 9),
        originRegion: targetRegion,
        carbonIntensity: intensity,
        threshold,
        slaTier: tier,
        artifactSizeGb: Number(artifactSizeGb) || 2.5
      });

      // Autonomous Governance: If Gemini proposes green migration and WAN egress is economically cleared:
      if (geminiRerouteProposal && geminiRerouteProposal.proposed && geminiRerouteProposal.egressAllowed) {
        const originRegion = targetRegion;
        targetRegion = geminiRerouteProposal.candidateRegion;
        intensity = geminiRerouteProposal.candidateIntensity;
        
        decision = {
          decision: 'REROUTED' as any,
          status: 'DISPATCHED_TO_GREEN_REGION' as any,
          reason: `Gemini 2.5 Flash autonomous tool loop rerouted from ${originRegion} (${geminiRerouteProposal.originIntensity} gCO2/kWh) to green region ${targetRegion} (${geminiRerouteProposal.candidateIntensity} gCO2/kWh), abating ${geminiRerouteProposal.estimatedSavingsKg} kg CO2e.`,
          estWait: 'Now'
        };
        isBelow = true;
      }
    } catch (gErr) {
      console.warn('Gemini critical-path reroute proposal notice:', gErr);
    }
  }

  // Dynamic Energy & Emissions Accounting (Green Software Foundation / GHG Scope 1-3)
  const runnerHours = 0.25;
  const runnerKw = 0.25;
  const pue = 1.15;
  const energyKwh = runnerHours * runnerKw * pue; // ~0.071875 kWh
  const marginalFossilIntensity = 480; // gCO2eq/kWh marginal fossil baseline
  const baselineEmissionsG = energyKwh * marginalFossilIntensity;
  const actualEmissionsG = energyKwh * intensity;
  
  // Calculate verified carbon savings (prioritize Gemini autonomous savings if rerouted)
  const savedGrams = isBelow ? Math.max(0, baselineEmissionsG - actualEmissionsG) : 0;
  const savedKg = geminiRerouteProposal?.estimatedSavingsKg 
    ? Number(geminiRerouteProposal.estimatedSavingsKg)
    : Number((savedGrams / 1000).toFixed(3));
  const costUsd = Number((runnerHours * 60 * 0.012).toFixed(2));

  const newItem: PersistentQueueItem & { rerouteProposal?: any } = {
    id: workloadId,
    repo: workloadRepo,
    branch: branch || 'main',
    commitSha: commitSha || Math.random().toString(36).substring(2, 9),
    awsRegion: targetRegion,
    carbonIntensity: intensity,
    threshold,
    queueTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    estWait: decision.estWait || '~ 1m 00s',
    status: decision.status,
    decision: decision.decision,
    decisionReason: decision.reason,
    commitAuthor: commitAuthor || 'Developer',
    workflowId: `wf-${Math.floor(Math.random() * 90000) + 10000}`,
    createdAt: new Date(now).toISOString(),
    slaTier: tier,
    rerouteProposal: geminiRerouteProposal || undefined
  };

  // Run SQS Enqueue through Error Interceptor with Exponential Backoff
  const interceptResult = await globalDeploymentInterceptor.executeWithInterceptor(
    async () => {
      globalDb.enqueue(newItem);

      // Add to persistent activity log
      globalDb.addActivity({
        id: `act-${now}`,
        repo: newItem.repo,
        branch: newItem.branch,
        commitSha: `sha-${newItem.commitSha.substring(0, 5)}`,
        gridScore: Math.max(0, Math.min(100, Math.round((1 - intensity / 700) * 100))),
        decision: decision.decision as any,
        carbonImpact: isBelow ? `-${(savedKg * 1000).toFixed(0)}g CO2 (saved)` : `+${((intensity - threshold) * 0.05).toFixed(1)}kg (held)`,
        status: isBelow ? 'Running' : 'Scheduled',
        timestamp: 'Just now',
        awsRegion: newItem.awsRegion,
        carbonValue: intensity,
        savedKg
      });

      // Record decision in SHA-256 audit ledger (Pillar 6)
      await globalAuditLedger.appendBlock({
        deploymentId: newItem.id,
        repo: newItem.repo,
        decision: decision.decision,
        carbonIntensity: intensity,
        carbonSavedKg: savedKg,
        costUsd,
        csrdScope3Category: CSRD_SCOPE3_CATEGORY
      });

      // Fan out pipeline event to Google Cloud Pub/Sub
      try {
        await globalGoogleCloud.publishToPubSub({
          eventType: 'WORKLOAD_QUEUED',
          data: {
            workloadId: newItem.id,
            repo: newItem.repo,
            decision: decision.decision,
            carbonIntensity: intensity,
            slaTier: tier,
            geminiRerouteCandidate: geminiRerouteProposal?.candidateRegion || null
          }
        });
      } catch (e) {
        console.warn('Google Cloud Pub/Sub fanout notice:', e);
      }

      // Best-effort dispatch to AWS SQS
      let sqsSend;
      try {
        sqsSend = await sendToSqs({ ...newItem, enqueuedAt: new Date(now).toISOString() });
      } catch (err: any) {
        console.warn('SQS send failed, continuing in sandbox mode:', err?.message || err);
        sqsSend = { simulated: true, messageId: `sim-${now}`, region: null };
      }

      return { item: newItem, sqsSend };
    },
    'SQS_QUEUE',
    `SQS [${newItem.awsRegion}] Queue Dispatcher`,
    forceSimulatedError ? forceSimulatedError : undefined
  );

  if (!interceptResult.result) {
    res.status(503).json({
      error: interceptResult.error || 'SQS Dispatch failed after exponential retries.',
      interceptResult,
      interceptorLogs: globalDeploymentInterceptor.getLogs()
    });
    return;
  }

  let aiOptimization = null;
  if (includeAiAdvice) {
    try {
      const advisory = await generateAiSustainabilityAdvisory();
      const resolvedSavings = advisory.potentialSavingsKg ?? geminiRerouteProposal?.estimatedSavingsKg ?? savedKg;
      aiOptimization = {
        ...advisory,
        potentialSavingsKg: resolvedSavings,
        estimatedSavingsKg: resolvedSavings
      };
    } catch (e) {
      console.warn('AI advisory generation fallback:', e);
      if (geminiRerouteProposal) {
        aiOptimization = {
          recommendation: geminiRerouteProposal.reasoning,
          potentialSavingsKg: geminiRerouteProposal.estimatedSavingsKg,
          estimatedSavingsKg: geminiRerouteProposal.estimatedSavingsKg,
          optimalRegion: geminiRerouteProposal.candidateRegion,
          actionableSteps: [
            `Reroute to ${geminiRerouteProposal.candidateRegion} for ${geminiRerouteProposal.candidateIntensity} gCO2eq/kWh`,
            `Abate ${geminiRerouteProposal.estimatedSavingsKg} kg CO2e emissions`,
            'Record certified carbon offset block in SHA-256 audit ledger'
          ]
        };
      }
    }
  }

  let notificationPayload = null;
  if (!isBelow) {
    const overrideUrl = `https://optigreen-368696905831.asia-south1.run.app/api/queue/${workloadId}/override`;
    const notificationContext = {
      workloadId,
      repo: workloadRepo,
      branch: branch || 'main',
      commitSha: commitSha || Math.random().toString(36).substring(2, 9),
      author: commitAuthor || 'Developer',
      originRegion: targetRegion,
      currentIntensity: intensity,
      threshold,
      holdEstimatedMinutes: tier === 'P2_FEATURE' ? 35 : 90,
      carbonAvoidedKg: Number(((intensity - threshold) * 0.05).toFixed(2)),
      overrideUrl
    };

    notificationPayload = {
      gitHubPrComment: generateGitHubPrMarkdownComment(notificationContext),
      slackBlockKit: generateSlackBlockKitMessage(notificationContext)
    };
  }

  res.json({
    success: true,
    item: interceptResult.result.item,
    decision,
    sqs: interceptResult.result.sqsSend,
    geminiRerouteProposal,
    aiOptimization,
    developerNotification: notificationPayload,
    interceptResult,
    interceptorLogs: globalDeploymentInterceptor.getLogs()
  });
}

export async function deployWorkload(req: Request, res: Response): Promise<void> {
  const { id, repo, branch, commitSha, awsRegion, carbonIntensity, commitAuthor, forceSimulatedError } = req.body;
  const queue = globalDb.getQueue();
  const existing = queue.find((item) => item.id === id);
  const systemThreshold = globalDb.getSettings().threshold;

  const deployedItem: PersistentQueueItem = existing || {
    id: id || `sqs-msg-${Date.now()}`,
    repo: repo || 'payment-api-gateway',
    branch: branch || 'main',
    commitSha: commitSha || 'f2a9c1e',
    awsRegion: awsRegion || 'us-east-1',
    carbonIntensity: Number(carbonIntensity) || 210,
    threshold: systemThreshold,
    queueTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    estWait: 'Now',
    status: 'DEPLOYED',
    decision: 'OVERRIDE',
    commitAuthor: commitAuthor || 'Sarah Chen',
    workflowId: `wf-${Math.floor(Math.random() * 90000) + 10000}`,
    createdAt: new Date().toISOString(),
    slaTier: 'P1_HOTFIX' as SlaTier
  };

  if (existing) {
    globalDb.removeQueueItem(id);
  }

  const interceptResult = await globalDeploymentInterceptor.executeWithInterceptor(
    async () => {
      globalDb.addActivity({
        id: `act-${Date.now()}`,
        repo: deployedItem.repo,
        branch: deployedItem.branch,
        commitSha: `sha-${deployedItem.commitSha.substring(0, 5)}`,
        gridScore: Math.max(0, Math.min(100, Math.round((1 - deployedItem.carbonIntensity / 700) * 100))),
        decision: 'OVERRIDE',
        carbonImpact: '+1.8kg CO2',
        status: 'Completed',
        timestamp: 'Just now',
        awsRegion: deployedItem.awsRegion,
        carbonValue: deployedItem.carbonIntensity,
        savedKg: 0
      });

      await globalAuditLedger.appendBlock({
        deploymentId: deployedItem.id,
        repo: deployedItem.repo,
        decision: 'OVERRIDE',
        carbonIntensity: deployedItem.carbonIntensity,
        carbonSavedKg: 0,
        costUsd: Number((0.8 + deployedItem.carbonIntensity / 500).toFixed(2)),
        csrdScope3Category: CSRD_SCOPE3_CATEGORY
      });

      try {
        await globalGoogleCloud.publishToPubSub({
          eventType: 'DISPATCHED_TO_GREEN_REGION',
          data: deployedItem
        });
        await globalGoogleCloud.syncToFirestore(deployedItem);
      } catch (e) {
        console.warn('Google Cloud dispatch event sync notice:', e);
      }

      try {
        await sendToSqs({ ...deployedItem, action: 'DEPLOY', dispatchedAt: new Date().toISOString() });
      } catch (err: any) {
        console.warn('SQS send failed, continuing in sandbox mode:', err?.message || err);
      }

      return deployedItem;
    },
    'GITHUB_ACTIONS_WEBHOOK',
    `Deployment Dispatcher (${deployedItem.repo})`,
    forceSimulatedError ? forceSimulatedError : undefined
  );

  if (!interceptResult.result) {
    res.status(503).json({
      error: interceptResult.error || 'Deployment dispatch failed after retries.',
      interceptResult,
      interceptorLogs: globalDeploymentInterceptor.getLogs()
    });
    return;
  }

  res.json({
    success: true,
    deployedItem,
    interceptResult,
    interceptorLogs: globalDeploymentInterceptor.getLogs()
  });
}

export function cancelWorkload(req: Request, res: Response): void {
  const { id } = req.params;
  globalDb.removeQueueItem(id);
  res.json({ success: true });
}

export function updateThreshold(req: Request, res: Response): void {
  const { threshold } = req.body;
  if (typeof threshold === 'number' && threshold >= 50 && threshold <= 700) {
    globalDb.updateSettings({ threshold });
    // Re-evaluate queue status through SLA-tiered decision engine
    globalDb.getQueue().forEach((item) => {
      const result = decideDeployment({
        carbonIntensity: item.carbonIntensity,
        threshold,
        slaTier: item.slaTier || 'P2_FEATURE',
        queuedAt: item.createdAt
      });
      globalDb.updateQueueItem(item.id, {
        threshold,
        status: result.status,
        decision: result.decision as any,
        estWait: result.estWait || '~ 1m 30s'
      });
    });
    res.json({ success: true, threshold });
    return;
  }
  res.status(400).json({ error: 'Invalid threshold value (must be 50 - 700 gCO2eq/kWh)' });
}

export async function triggerEventBridge(req: Request, res: Response): Promise<void> {
  const released: any[] = [];
  const now = Date.now();
  const queue = globalDb.getQueue();
  const systemThreshold = globalDb.getSettings().threshold;

  for (const item of queue) {
    // 1. Never revert already dispatched, deployed, or emergency override jobs back to HELD
    if (
      item.status === 'DEPLOYED' || 
      item.decision === 'OVERRIDE' || 
      item.decision === 'PROCEED' || 
      item.decision === 'REROUTED'
    ) {
      continue;
    }

    // 2. Refetch current live regional grid intensity so cleaner grid windows can release held jobs
    let currentIntensity = item.carbonIntensity;
    try {
      const liveTelemetry = await getServerSideRegionIntensity(item.awsRegion);
      if (liveTelemetry && typeof liveTelemetry.intensity === 'number') {
        currentIntensity = liveTelemetry.intensity;
      }
    } catch {
      // Retain existing intensity snapshot if lookup fails
    }

    const result = decideDeployment({
      carbonIntensity: currentIntensity,
      threshold: systemThreshold,
      slaTier: item.slaTier || 'P2_FEATURE',
      queuedAt: item.createdAt,
      now
    });

    // 3. Release when intensity falls below threshold, SLA auto-escalates, or hotfix overrides
    if (result.decision === 'PROCEED' || result.decision === 'SLA_AUTO_ESCALATED' || result.decision === 'OVERRIDE') {
      const deployedItem = {
        ...item,
        carbonIntensity: currentIntensity,
        status: 'DEPLOYED' as const,
        decision: result.decision,
        estWait: 'Now'
      };
      globalDb.removeQueueItem(item.id);
      released.push(deployedItem);

      // Unified Energy & Emissions Accounting
      const runnerHours = 0.25;
      const runnerKw = 0.25;
      const pue = 1.15;
      const energyKwh = runnerHours * runnerKw * pue;
      
      // Calculate carbon saved relative to initial queue hold snapshot or marginal fossil baseline
      const marginalFossilIntensity = 480;
      const baselineIntensity = Math.max(item.carbonIntensity, marginalFossilIntensity);
      const dynamicSavedG = Math.max(0, energyKwh * (baselineIntensity - currentIntensity));
      const dynamicSavedKg = result.decision === 'SLA_AUTO_ESCALATED' || result.decision === 'OVERRIDE'
        ? 0 
        : Number((dynamicSavedG / 1000).toFixed(3));
      const dynamicCostUsd = Number((runnerHours * 60 * 0.012).toFixed(2));

      globalDb.addActivity({
        id: `act-eventbridge-${item.id}-${now}`,
        repo: item.repo,
        branch: item.branch,
        commitSha: `sha-${item.commitSha.substring(0, 5)}`,
        gridScore: Math.max(0, Math.min(100, Math.round((1 - currentIntensity / 700) * 100))),
        decision: result.decision as any,
        carbonImpact: result.decision === 'SLA_AUTO_ESCALATED' 
          ? '+2.1kg CO2 (SLA escalation)' 
          : result.decision === 'OVERRIDE'
          ? '+1.8kg CO2 (Override release)'
          : `-${(dynamicSavedKg * 1000).toFixed(0)}g CO2 (saved)`,
        status: 'Completed',
        timestamp: 'Just now',
        awsRegion: item.awsRegion,
        carbonValue: currentIntensity,
        savedKg: dynamicSavedKg
      });

      await globalAuditLedger.appendBlock({
        deploymentId: item.id,
        repo: item.repo,
        decision: result.decision,
        carbonIntensity: currentIntensity,
        carbonSavedKg: dynamicSavedKg,
        costUsd: dynamicCostUsd,
        csrdScope3Category: CSRD_SCOPE3_CATEGORY
      });
    } else {
      globalDb.updateQueueItem(item.id, {
        carbonIntensity: currentIntensity,
        estWait: result.estWait,
        status: 'HELD',
        decision: 'QUEUE'
      });
    }
  }

  res.json({
    triggeredAt: new Date(now).toISOString(),
    releasedCount: released.length,
    remainingQueued: globalDb.getQueue().length,
    releasedItems: released
  });
}

export async function overrideHeldWorkload(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const queue = globalDb.getQueue();
  const item = queue.find(q => q.id === id);

  if (!item) {
    res.status(404).json({ error: 'Held workload not found in active queue' });
    return;
  }

  globalDb.removeQueueItem(id);
  const now = Date.now();

  const activity = globalDb.addActivity({
    id: `act-override-${item.id}-${now}`,
    repo: item.repo,
    branch: item.branch,
    commitSha: `sha-${item.commitSha.substring(0, 5)}`,
    gridScore: Math.max(0, Math.min(100, Math.round((1 - item.carbonIntensity / 700) * 100))),
    decision: 'OVERRIDE' as any,
    carbonImpact: '+1.8kg CO2 (1-Click Developer Override)',
    status: 'Completed',
    timestamp: 'Just now',
    awsRegion: item.awsRegion,
    carbonValue: item.carbonIntensity,
    savedKg: 0
  });

  await globalAuditLedger.appendBlock({
    deploymentId: item.id,
    repo: item.repo,
    decision: 'OVERRIDE',
    carbonIntensity: item.carbonIntensity,
    carbonSavedKg: 0,
    costUsd: 0.18,
    csrdScope3Category: CSRD_SCOPE3_CATEGORY
  });

  res.json({
    success: true,
    message: `1-Click Developer Override executed: Workload ${id} dispatched immediately to runner pool.`,
    workloadId: id,
    action: 'FORCE_DISPATCHED',
    auditLedgerCommitted: true
  });
}
