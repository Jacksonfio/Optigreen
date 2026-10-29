import { describe, it, expect } from 'vitest';
import {
  decideDeployment,
  getMaxDeferralMs,
  SLA_POLICY,
  evaluateCrossRegionMigration
} from '../src/services/carbonDecisionEngine';

describe('carbonDecisionEngine', () => {
  it('proceeds immediately when grid intensity is within the threshold', () => {
    const result = decideDeployment({ carbonIntensity: 180, threshold: 250 });
    expect(result.decision).toBe('PROCEED');
    expect(result.status).toBe('QUEUED');
  });

  it('holds when grid intensity exceeds the threshold', () => {
    const result = decideDeployment({ carbonIntensity: 420, threshold: 250 });
    expect(result.decision).toBe('QUEUE');
    expect(result.status).toBe('HELD');
  });

  it('P1_HOTFIX bypasses the carbon hold window entirely', () => {
    const result = decideDeployment({ carbonIntensity: 900, threshold: 250, slaTier: 'P1_HOTFIX' });
    expect(result.decision).toBe('OVERRIDE');
    expect(result.status).toBe('DEPLOYED');
    expect(result.reason).toContain('P1_HOTFIX');
  });

  it('P2_FEATURE auto-escalates once the 60-minute deferral budget is exhausted', () => {
    const queuedAt = new Date(Date.now() - 61 * 60 * 1000).toISOString();
    const result = decideDeployment({ carbonIntensity: 420, threshold: 250, slaTier: 'P2_FEATURE', queuedAt });
    expect(result.decision).toBe('SLA_AUTO_ESCALATED');
    expect(result.status).toBe('DEPLOYED');
  });

  it('P2_FEATURE stays held while within its deferral budget', () => {
    const queuedAt = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const result = decideDeployment({ carbonIntensity: 420, threshold: 250, slaTier: 'P2_FEATURE', queuedAt });
    expect(result.decision).toBe('QUEUE');
    expect(result.estWait).toContain('SLA escalation');
  });

  it('P3_BATCH holds indefinitely until a green window arrives', () => {
    const queuedAt = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const result = decideDeployment({ carbonIntensity: 680, threshold: 250, slaTier: 'P3_BATCH', queuedAt });
    expect(result.decision).toBe('QUEUE');
    expect(result.estWait).not.toContain('SLA escalation');
  });

  it('holds green-window work and treats the threshold boundary inclusively', () => {
    expect(decideDeployment({ carbonIntensity: 250, threshold: 250 }).decision).toBe('PROCEED');
    expect(decideDeployment({ carbonIntensity: 251, threshold: 250 }).decision).toBe('QUEUE');
  });

  it('exposes the documented per-tier deferral policy', () => {
    expect(SLA_POLICY.P1_HOTFIX.maxDeferralMinutes).toBe(0);
    expect(SLA_POLICY.P2_FEATURE.maxDeferralMinutes).toBe(60);
    expect(SLA_POLICY.P3_BATCH.maxDeferralMinutes).toBe(Infinity);
    expect(getMaxDeferralMs('P2_FEATURE')).toBe(60 * 60 * 1000);
  });

  describe('evaluateCrossRegionMigration (Egress Arbitrage)', () => {
    it('allows migration when carbon savings value exceeds egress transfer cost', () => {
      const result = evaluateCrossRegionMigration({
        originRegion: 'eu-central-1',
        originIntensity: 412,
        targetRegion: 'eu-north-1',
        targetIntensity: 25,
        artifactSizeGb: 2,
        computeHours: 2,
        serverPowerKw: 2.5,
        carbonPricePerTonUsd: 50
      });

      expect(result.allowed).toBe(true);
      expect(result.netCarbonSavedKg).toBeGreaterThan(1.5);
      expect(result.carbonValueUsd).toBeGreaterThan(result.egressCostUsd);
      expect(result.reason).toContain('Economically and environmentally positive');
    });

    it('vetoes migration when egress bandwidth penalty outstrips carbon value', () => {
      const result = evaluateCrossRegionMigration({
        originRegion: 'us-east-1',
        originIntensity: 220,
        targetRegion: 'us-west-2',
        targetIntensity: 210, // Small 10 gCO2 difference
        artifactSizeGb: 50, // 50GB * $0.02 = $1.00 egress cost
        computeHours: 0.5,
        serverPowerKw: 1.0,
        carbonPricePerTonUsd: 50
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Egress penalty');
      expect(result.reason).toContain('Migration vetoed; defer locally instead');
    });

    it('rejects migration if target region is dirtier than origin', () => {
      const result = evaluateCrossRegionMigration({
        originRegion: 'eu-north-1',
        originIntensity: 25,
        targetRegion: 'ap-southeast-1',
        targetIntensity: 680,
        artifactSizeGb: 1
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('is not cleaner');
    });
  });
});