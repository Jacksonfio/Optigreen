import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import {
  proposeCandidateRerouting,
  executeGeminiTool,
  GEMINI_TOOL_DECLARATIONS
} from '../src/services/geminiService';

describe('Gemini 3 Critical Path AI Orchestration & Tool-Calling', () => {
  it('declares the required 4 official tool function declarations', () => {
    const decls = GEMINI_TOOL_DECLARATIONS[0].functionDeclarations;
    const names = decls.map(d => d.name);

    expect(names).toContain('inspectRegionalGridTelemetry');
    expect(names).toContain('evaluateWanEgressVeto');
    expect(names).toContain('dispatchWorkloadMigration');
    expect(names).toContain('escalateP1Hotfix');
  });

  it('executes inspectRegionalGridTelemetry tool and returns regional intensities', async () => {
    const result = await executeGeminiTool('inspectRegionalGridTelemetry', {
      regions: ['us-west-2', 'eu-north-1']
    });

    expect(result['us-west-2']).toBeDefined();
    expect(result['us-west-2'].intensity).toBeGreaterThan(0);
    expect(result['eu-north-1']).toBeDefined();
    expect(result['eu-north-1'].intensity).toBeLessThan(100);
  });

  it('executes evaluateWanEgressVeto tool computing network egress vs carbon value', async () => {
    // 1.0 GB runner: carbon savings outweigh egress cost -> APPROVED
    const approved = await executeGeminiTool('evaluateWanEgressVeto', {
      originRegion: 'eu-central-1',
      originIntensity: 412,
      targetRegion: 'eu-north-1',
      targetIntensity: 25,
      artifactSizeGb: 1.0,
      computeHours: 2.0
    });

    expect(approved.allowed).toBe(true);
    expect(approved.netCarbonSavedKg).toBeGreaterThan(0);
    expect(approved.netBenefitUsd).toBeGreaterThan(0);

    // 100 GB heavy artifact: egress cost exceeds carbon value -> VETOED
    const vetoed = await executeGeminiTool('evaluateWanEgressVeto', {
      originRegion: 'us-east-1',
      originIntensity: 250,
      targetRegion: 'eu-north-1',
      targetIntensity: 230,
      artifactSizeGb: 100
    });

    expect(vetoed.allowed).toBe(false);
    expect(vetoed.reason).toContain('vetoed');
  });

  it('executes dispatchWorkloadMigration tool with proposed migration status', async () => {
    const result = await executeGeminiTool('dispatchWorkloadMigration', {
      workloadId: 'wl-123',
      targetRegion: 'eu-north-1',
      reason: 'Optimal green hydro region'
    });

    expect(result.status).toBe('MIGRATION_PROPOSED');
    expect(result.targetRegion).toBe('eu-north-1');
  });

  it('executes escalateP1Hotfix tool for mission-critical bypass', async () => {
    const result = await executeGeminiTool('escalateP1Hotfix', {
      workloadId: 'wl-p1-999',
      reason: 'P1 hotfix SLA bypass'
    });

    expect(result.status).toBe('SLA_HOTFIX_OVERRIDE');
    expect(result.workloadId).toBe('wl-p1-999');
  });

  it('proposes candidate rerouting inside proposeCandidateRerouting with multi-turn tool execution', async () => {
    const proposal = await proposeCandidateRerouting({
      workloadId: 'test-wl-high-carbon',
      repo: 'payment-processor',
      branch: 'main',
      commitSha: 'a1b2c3d',
      originRegion: 'ap-southeast-1',
      carbonIntensity: 680,
      threshold: 250,
      slaTier: 'P2_FEATURE',
      artifactSizeGb: 2.5
    });

    expect(proposal.proposed).toBe(true);
    expect(proposal.originIntensity).toBe(680);
    expect(proposal.candidateIntensity).toBeLessThan(250);
    expect(proposal.estimatedSavingsKg).toBeGreaterThan(0);
    expect(proposal.toolsExecuted.length).toBeGreaterThanOrEqual(2);

    const executedNames = proposal.toolsExecuted.map(t => t.tool);
    expect(executedNames).toContain('inspectRegionalGridTelemetry');
    expect(executedNames).toContain('evaluateWanEgressVeto');
  }, 30000);

  it('places Gemini tool-calling on the critical path of POST /api/queue/enqueue when emissions exceed SLA threshold', async () => {
    const highCarbonPayload = {
      repo: 'fraud-detection-model',
      branch: 'main',
      commitSha: '7f6e5d4',
      awsRegion: 'ap-south-1', // Mumbai: ~710 gCO2/kWh
      carbonIntensity: 710,
      commitAuthor: 'Data Engineer',
      slaTier: 'P2_FEATURE'
    };

    const res = await request(app)
      .post('/api/queue/enqueue')
      .send(highCarbonPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.decision.decision).toBe('QUEUE');

    // VERIFY CRITICAL PATH GEMINI REROUTE PROPOSAL
    expect(res.body.geminiRerouteProposal).toBeDefined();
    expect(res.body.geminiRerouteProposal.proposed).toBe(true);
    expect(res.body.geminiRerouteProposal.candidateRegion).toBeDefined();
    expect(res.body.geminiRerouteProposal.candidateIntensity).toBeLessThan(710);
    expect(res.body.geminiRerouteProposal.estimatedSavingsKg).toBeGreaterThan(0);

    // Verify executed tools in the multi-turn loop
    const tools = res.body.geminiRerouteProposal.toolsExecuted;
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThanOrEqual(2);

    const toolNames = tools.map((t: any) => t.tool);
    expect(toolNames).toContain('inspectRegionalGridTelemetry');
    expect(toolNames).toContain('evaluateWanEgressVeto');
  }, 30000);

  it('does NOT propose rerouting when origin region is already green and within SLA threshold', async () => {
    const greenPayload = {
      repo: 'static-assets-cdn',
      branch: 'main',
      commitSha: '1a2b3c4',
      awsRegion: 'us-west-2', // Oregon: ~110 gCO2/kWh
      carbonIntensity: 110,
      commitAuthor: 'FrontEnd Dev',
      slaTier: 'P2_FEATURE'
    };

    const res = await request(app)
      .post('/api/queue/enqueue')
      .send(greenPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.decision.decision).toBe('PROCEED');
    expect(res.body.geminiRerouteProposal).toBeNull();
  });
});
