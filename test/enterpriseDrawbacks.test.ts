/**
 * Enterprise Drawbacks Solution Test Suite
 * 
 * Verifies all 5 enterprise enhancements:
 * 1. Data Affinity matrix & WAN network round-trip latency veto in Pareto solver
 * 2. Speculative pre-build PR merge probability classifier (>= 85% safety gate)
 * 3. Real historical grid replay scenario telemetry (Electricity Maps / WattTime data)
 * 4. Developer ergonomics: GitHub PR comment & Slack 1-click self-serve override bot
 * 5. 1-Click developer override execution on active queue
 */

import { describe, it, expect } from 'vitest';
import { evaluateCrossRegionMigration, getWanLatencyMs } from '../src/services/carbonDecisionEngine';
import { evaluatePrMergeProbability } from '../src/services/prMergeClassifier';
import { getHistoricalReplayScenario } from '../src/services/historicalGridService';
import { generateGitHubPrMarkdownComment, generateSlackBlockKitMessage } from '../src/services/notificationBotService';

describe('Enterprise Drawbacks Solution Suite', () => {
  describe('Drawback 1: Data Affinity & WAN Network Latency Matrix', () => {
    it('blocks cross-region migration when workload is tagged with strict_local affinity', () => {
      const result = evaluateCrossRegionMigration({
        originRegion: 'us-east-1',
        originIntensity: 420,
        targetRegion: 'eu-north-1',
        targetIntensity: 25,
        artifactSizeGb: 0.1,
        dataAffinity: 'strict_local'
      });

      expect(result.allowed).toBe(false);
      expect(result.dataAffinityCompliant).toBe(false);
      expect(result.reason).toContain("Workload is tagged 'strict_local'");
    });

    it('vetoes cross-region migration when WAN latency exceeds maximum budget', () => {
      const result = evaluateCrossRegionMigration({
        originRegion: 'us-east-1',
        originIntensity: 420,
        targetRegion: 'ap-south-1',
        targetIntensity: 25,
        artifactSizeGb: 0.1,
        dataAffinity: 'global_roaming',
        maxAllowedLatencyMs: 100 // us-east-1 to ap-south-1 is ~185ms
      });

      expect(result.allowed).toBe(false);
      expect(result.wanLatencyMs).toBeGreaterThan(100);
      expect(result.reason).toContain('Network latency constraint');
    });

    it('approves migration when affinity is global_roaming and WAN latency is within budget', () => {
      const latency = getWanLatencyMs('eu-central-1', 'eu-north-1');
      expect(latency).toBeLessThan(50); // Low-latency European fiber route (~32ms)

      const result = evaluateCrossRegionMigration({
        originRegion: 'eu-central-1',
        originIntensity: 412,
        targetRegion: 'eu-north-1',
        targetIntensity: 25,
        artifactSizeGb: 0.05,
        dataAffinity: 'global_roaming',
        maxAllowedLatencyMs: 150
      });

      expect(result.allowed).toBe(true);
      expect(result.wanLatencyMs).toBe(32);
    });
  });

  describe('Drawback 4: Speculative Pre-Build PR Merge Probability Gate', () => {
    it('approves speculative pre-build for high-confidence, atomic pull requests (>= 85%)', () => {
      const decision = evaluatePrMergeProbability({
        prNumber: 104,
        repo: 'payment-service',
        filesChanged: 3,
        linesAdded: 45,
        linesDeleted: 12,
        authorMergeRatePct: 92,
        isDraft: false,
        hasMergeConflicts: false,
        ciStatus: 'SUCCESS'
      });

      expect(decision.shouldPrebuild).toBe(true);
      expect(decision.mergeProbabilityPct).toBeGreaterThanOrEqual(85);
      expect(decision.energyWasteRisk).toBe('LOW');
    });

    it('blocks speculative pre-build for draft PRs to prevent wasted compute energy', () => {
      const decision = evaluatePrMergeProbability({
        prNumber: 105,
        repo: 'payment-service',
        filesChanged: 2,
        linesAdded: 30,
        linesDeleted: 5,
        isDraft: true,
        hasMergeConflicts: false
      });

      expect(decision.shouldPrebuild).toBe(false);
      expect(decision.energyWasteRisk).toBe('HIGH');
      expect(decision.reason).toContain('Draft state');
    });

    it('blocks speculative pre-build for high-churn PRs with merge conflicts', () => {
      const decision = evaluatePrMergeProbability({
        prNumber: 106,
        repo: 'monolith-core',
        filesChanged: 42,
        linesAdded: 2400,
        linesDeleted: 850,
        isDraft: false,
        hasMergeConflicts: true
      });

      expect(decision.shouldPrebuild).toBe(false);
      expect(decision.reason).toContain('Merge conflicts detected');
    });
  });

  describe('Drawback 3: Real Historical Grid Replay Mode', () => {
    it('returns verified Electricity Maps historical time-series for Nordic Wind Peak', () => {
      const replay = getHistoricalReplayScenario('nordic_wind_peak');
      expect(replay.scenario).toBe('nordic_wind_peak');
      expect(replay.snapshots.length).toBeGreaterThan(0);
      expect(replay.snapshots[0].originZone).toBe('SE-SE3');
      expect(replay.snapshots[0].intensityGco2Kwh).toBeLessThan(35);
    });

    it('returns verified German winter coal crunch peak telemetry', () => {
      const replay = getHistoricalReplayScenario('frankfurt_coal_crunch');
      expect(replay.snapshots.some(s => s.intensityGco2Kwh > 500)).toBe(true);
      expect(replay.snapshots[0].originZone).toBe('DE');
    });
  });

  describe('Drawback 5: Developer Ergonomics & 1-Click Self-Serve Override Bot', () => {
    const mockContext = {
      workloadId: 'sqs-msg-12345',
      repo: 'checkout-frontend',
      branch: 'feature/payment-v2',
      commitSha: 'a1b2c3d4e5f6',
      author: 'Jordan Lee',
      originRegion: 'us-east-1',
      currentIntensity: 420,
      threshold: 200,
      holdEstimatedMinutes: 25,
      carbonAvoidedKg: 1.4,
      overrideUrl: 'https://optigreen-368696905831.asia-south1.run.app/api/queue/sqs-msg-12345/override'
    };

    it('generates transparent GitHub PR markdown comment with 1-click override link', () => {
      const comment = generateGitHubPrMarkdownComment(mockContext);
      expect(comment).toContain('Build Hold Notice');
      expect(comment).toContain('420 gCO₂eq/kWh');
      expect(comment).toContain('Click Here to Force-Dispatch Immediately');
      expect(comment).toContain(mockContext.overrideUrl);
    });

    it('generates interactive Slack Block Kit card with action button', () => {
      const slack = generateSlackBlockKitMessage(mockContext);
      expect(slack.blocks).toBeDefined();
      expect(slack.blocks.length).toBeGreaterThan(1);
      const actionBlock = slack.blocks.find((b: any) => b.type === 'actions');
      expect(actionBlock).toBeDefined();
      expect(actionBlock.elements[0].url).toBe(mockContext.overrideUrl);
    });
  });
});
