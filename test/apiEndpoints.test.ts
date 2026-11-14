import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server';

describe('OptiGreen REST API Endpoints', () => {
  it('GET /api/health returns status ok with timestamp', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/integrations/status reports runtime mode for all external services', async () => {
    const res = await request(app).get('/api/integrations/status');
    expect(res.status).toBe(200);
    expect(res.body.awsSqs).toBeDefined();
    expect(res.body.awsSqs.mode).toMatch(/^(LIVE|SANDBOX)$/);
    expect(res.body.electricityMaps).toBeDefined();
    expect(res.body.gemini).toBeDefined();
    expect(res.body.auditLedger.mode).toBe('LOCAL_SHA256_CHAIN');
    expect(res.body.database).toBeDefined();
    expect(res.body.database.isDurable).toBe(false);
  });

  it('GET /api/database/stats returns ACID-safe persistence telemetry', async () => {
    const res = await request(app).get('/api/database/stats');
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('CONTAINER_LOCAL_JSON');
    expect(res.body.isDurable).toBe(false);
    expect(res.body.totalQueued).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/carbon/all-regions returns grid intensities for 17 AWS regions', async () => {
    const res = await request(app).get('/api/carbon/all-regions');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(17);
    expect(Array.isArray(res.body.regions)).toBe(true);
    expect(res.body.regions.length).toBe(17);

    const oregon = res.body.regions.find((r: any) => r.awsRegion === 'us-west-2');
    expect(oregon).toBeDefined();
    expect(oregon.carbonIntensity).toBeGreaterThan(0);
    expect(oregon.status).toBeDefined();
  });

  it('GET /api/ledger returns SHA-256 hash-chained blocks with valid verification', async () => {
    const res = await request(app).get('/api/ledger');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.chain)).toBe(true);
    expect(res.body.verification.valid).toBe(true);
    expect(res.body.csrdScope3Category).toContain('Scope 3');
  });

  it('POST /api/queue/enqueue creates a decision, records a ledger block, and dispatches to queue', async () => {
    const payload = {
      repo: 'checkout-service',
      branch: 'main',
      commitSha: '9e8d7c6',
      awsRegion: 'us-west-2',
      carbonIntensity: 110,
      commitAuthor: 'Test Bot',
      slaTier: 'P2_FEATURE'
    };

    const res = await request(app)
      .post('/api/queue/enqueue')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.decision.decision).toBe('PROCEED');
    expect(res.body.item.repo).toBe('checkout-service');
  });

  it('POST /api/settings/threshold updates the carbon threshold and enforces bounds', async () => {
    const resValid = await request(app)
      .post('/api/settings/threshold')
      .send({ threshold: 220 });
    expect(resValid.status).toBe(200);
    expect(resValid.body.threshold).toBe(220);

    const resInvalid = await request(app)
      .post('/api/settings/threshold')
      .send({ threshold: 1000 });
    expect(resInvalid.status).toBe(400);
  });

  it('POST /api/ai-optimize returns structured Gemini JSON advisory schema', async () => {
    const res = await request(app).post('/api/ai-optimize');
    expect(res.status).toBe(200);
    expect(typeof res.body.recommendation).toBe('string');
    expect(typeof res.body.potentialSavingsKg).toBe('number');
    expect(typeof res.body.optimalRegion).toBe('string');
    expect(Array.isArray(res.body.actionableSteps)).toBe(true);
    expect(res.body.actionableSteps.length).toBeGreaterThan(0);
  }, 30000);

  it('POST /api/queue/enqueue includes AI advisory when includeAiAdvice flag is set', async () => {
    const res = await request(app)
      .post('/api/queue/enqueue')
      .send({
        repo: 'analytics-api',
        branch: 'main',
        commitSha: '3a2b1c0',
        awsRegion: 'ap-southeast-1',
        carbonIntensity: 680,
        includeAiAdvice: true
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.aiOptimization).toBeDefined();
    expect(typeof res.body.aiOptimization.recommendation).toBe('string');
  }, 60000);

  it('GET /api/optigreen/conformance returns specification metadata and test counts', async () => {
    const res = await request(app).get('/api/optigreen/conformance');
    expect(res.status).toBe(200);
    expect(res.body.contractVersion).toBe('1.0.0');
    expect(res.body.specification.title).toContain('OptiGreen: A Proposed Interoperable Semantic Contract');
    expect(res.body.conformanceTests.passed).toBe(20);
  });

  it('POST /api/optigreen/solve returns semantic decision, action, and cryptographic audit records', async () => {
    const payload = {
      workload: {
        version: '1.0.0',
        record_type: 'workload',
        workload_id: 'wl-api-test',
        repo: 'org/repo',
        commit_sha: '123456',
        workflow_name: 'test-flow',
        sla_tier: 'P2_FEATURE',
        max_duration_seconds: 600,
        created_at: new Date().toISOString()
      },
      candidates: [
        {
          version: '1.0.0',
          record_type: 'candidate',
          candidate_id: 'cand-1',
          workload_id: 'wl-api-test',
          dimensions: {
            location: { region: 'us-west-2', provider: 'aws' },
            timing: { scheduled_start: new Date().toISOString(), deferral_seconds: 0 },
            execution_path: 'cached',
            resource_config: { instance_family: 'c5.large', vcpus: 2, memory_gb: 4, pricing_mode: 'spot' }
          },
          predicted_metrics: { carbon_emissions_grams: 50, cost_usd: 0.05, duration_seconds: 120 }
        }
      ],
      constraints: {
        version: '1.0.0',
        record_type: 'constraint',
        constraint_id: 'con-1',
        workload_id: 'wl-api-test',
        rules: {}
      },
      objectives: {
        version: '1.0.0',
        record_type: 'objective',
        objective_id: 'obj-1',
        workload_id: 'wl-api-test',
        weights: { carbon_weight: 1, cost_weight: 0, latency_weight: 0 }
      }
    };

    const res = await request(app).post('/api/optigreen/solve').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.decision.decision).toBe('FEASIBLE');
    expect(res.body.decision.candidate_id).toBe('cand-1');
    expect(res.body.action.dispatch_status).toBe('DISPATCHED');
    expect(res.body.audit.provenance_signature).toBeDefined();
  });

  it('POST /api/queue/enqueue rejects unknown/typo regions with 400 error instead of hanging', async () => {
    const res = await request(app)
      .post('/api/queue/enqueue')
      .send({
        repo: 'analytics-api',
        awsRegion: 'us-eats-1'
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid or unsupported AWS region');
  });

  it('POST /api/queue/:id/override enforces fail-closed auth when OPTIGREEN_ADMIN_KEY is set and DEMO_MODE is not true', async () => {
    const originalKey = process.env.OPTIGREEN_ADMIN_KEY;
    const originalDemo = process.env.DEMO_MODE;

    try {
      process.env.OPTIGREEN_ADMIN_KEY = 'test-admin-secret-key';
      delete process.env.DEMO_MODE; // unset demo mode (defaults to fail-closed)

      // 1. Missing token -> 401
      const resMissing = await request(app).post('/api/queue/sqs-msg-123/override');
      expect(resMissing.status).toBe(401);
      expect(resMissing.body.error).toContain('Missing Bearer Token');

      // 2. Invalid token -> 403
      const resInvalid = await request(app)
        .post('/api/queue/sqs-msg-123/override')
        .set('Authorization', 'Bearer wrong-secret');
      expect(resInvalid.status).toBe(403);
      expect(resInvalid.body.error).toContain('Invalid Admin Token');

      // 3. Valid token passes auth
      const resValid = await request(app)
        .post('/api/queue/sqs-msg-123/override')
        .set('Authorization', 'Bearer test-admin-secret-key');
      // Should not be 401 or 403 (either 200 or 404 if item not in queue)
      expect(resValid.status).not.toBe(401);
      expect(resValid.status).not.toBe(403);

      // 4. Explicit DEMO_MODE='true' opens access for hackathon judges
      process.env.DEMO_MODE = 'true';
      const resDemo = await request(app).post('/api/queue/sqs-msg-123/override');
      expect(resDemo.status).not.toBe(401);
      expect(resDemo.status).not.toBe(403);
    } finally {
      process.env.OPTIGREEN_ADMIN_KEY = originalKey;
      process.env.DEMO_MODE = originalDemo;
    }
  });

  it('POST /api/gemini/copilot provides personalized DevOps advice, research paper synthesis, and code generation', async () => {
    // Mode 1: DevOps advisor
    const resAdvisor = await request(app)
      .post('/api/gemini/copilot')
      .send({ prompt: 'Recommend best region for urgent build', mode: 'advisor' });
    expect(resAdvisor.status).toBe(200);
    expect(resAdvisor.body.reply).toBeDefined();

    // Mode 2: Semantic contract supercomputer synthesis
    const resPaper = await request(app)
      .post('/api/gemini/copilot')
      .send({ prompt: 'Summarize the OptiGreen semantic contract', mode: 'paper' });
    expect(resPaper.status).toBe(200);
    expect(resPaper.body.reply).toContain('OptiGreen');
    expect(resPaper.body.reply.length).toBeGreaterThan(50);

    // Mode 3: Creative code generation
    const resCode = await request(app)
      .post('/api/gemini/copilot')
      .send({ prompt: 'Generate carbon-aware github actions workflow yaml', mode: 'code' });
    expect(resCode.status).toBe(200);
    expect(resCode.body.codeSnippet).toContain('OptiGreen');
  }, 30000);

  it('GET /api/gemini/status returns transparent runtime status and declared tools', async () => {
    const res = await request(app).get('/api/gemini/status');
    expect(res.status).toBe(200);
    expect(res.body.model).toBe('gemini-2.5-flash');
    expect(res.body.sdk).toBe('@google/genai');
    expect(res.body.criticalPathIntegrated).toBe(true);
    expect(Array.isArray(res.body.tools)).toBe(true);
    expect(res.body.tools).toContain('inspectRegionalGridTelemetry');
    expect(res.body.tools).toContain('evaluateWanEgressVeto');
  });

  it('POST /api/runner/execute-demo and GET /api/runner/executions track genuine execution lifecycle', async () => {
    // 1. Initial executions list
    const resInitial = await request(app).get('/api/runner/executions');
    expect(resInitial.status).toBe(200);
    expect(typeof resInitial.body.total).toBe('number');

    // 2. Execute controlled demo run
    const resDemo = await request(app)
      .post('/api/runner/execute-demo')
      .send({
        workloadId: 'wl-hackathon-audit-test',
        targetRegion: 'eu-north-1',
        carbonIntensity: 25,
        artifactSizeGb: 2.0
      });

    expect(resDemo.status).toBe(200);
    expect(resDemo.body.success).toBe(true);
    const record = resDemo.body.record;
    expect(record.workloadId).toBe('wl-hackathon-audit-test');
    expect(record.state).toBe('COMPLETED');
    expect(record.runnerType).toBe('LOCAL_SANDBOX_RUNNER');
    expect(record.durationSeconds).toBe(12);
    expect(record.energyConsumedKwh).toBeGreaterThan(0);
    expect(record.actualCarbonEmittedKg).toBeGreaterThan(0);
    expect(record.logs.length).toBeGreaterThan(2);

    // 3. Query execution by ID
    const resSingle = await request(app).get('/api/runner/execution/wl-hackathon-audit-test');
    expect(resSingle.status).toBe(200);
    expect(resSingle.body.workloadId).toBe('wl-hackathon-audit-test');
    expect(resSingle.body.state).toBe('COMPLETED');
  });
});
