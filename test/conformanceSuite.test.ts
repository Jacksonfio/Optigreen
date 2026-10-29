/**
 * OptiGreen Conformance Test Suite (T01 - T20)
 * Evaluates the 9 lifecycle records, first-class NO_FEASIBLE_SOLUTION handling,
 * error taxonomy (E_SCHEMA, E_UNIT, E_VERSION, E_CONSTRAINT, E_POLICY, E_REF),
 * and 3 conformance levels (L1, L2, L3) specified in the research paper.
 */

import { describe, it, expect } from 'vitest';
import {
  OPTIGREEN_CONTRACT_VERSION,
  WorkloadRecord,
  ObservationRecord,
  CandidateRecord,
  ConstraintRecord,
  ObjectiveRecord,
  OutcomeRecord,
  validateWorkloadRecord,
  validateObservationRecord,
  validateCandidateRecord,
  validateOutcomeRecord,
  solveOptiGreenDecision,
  createActionFromDecision,
  createAuditProvenance,
  computeRecordHash,
  OptiGreenContractError
} from '../src/contracts/optigreenContract';
import { evaluateCrossRegionMigration } from '../src/services/carbonDecisionEngine';

describe('OptiGreen Semantic Contract Conformance Suite (T01 - T20)', () => {
  const sampleWorkload: WorkloadRecord = {
    version: OPTIGREEN_CONTRACT_VERSION,
    record_type: 'workload',
    workload_id: 'wl-prod-build-001',
    repo: 'acme/core-checkout',
    commit_sha: 'a1b2c3d4e5f6',
    workflow_name: 'docker-build-push',
    sla_tier: 'P2_FEATURE',
    max_duration_seconds: 1800,
    data_residency: ['europe-west1', 'europe-north1'],
    created_at: new Date().toISOString()
  };

  // ---------------------------------------------------------------------------
  // Conformance Level 1: Measurement & Observation (T01 - T05)
  // ---------------------------------------------------------------------------
  it('T01: validates conforming workload record schema', () => {
    expect(() => validateWorkloadRecord(sampleWorkload)).not.toThrow();
  });

  it('T02: rejects workload record missing required fields with E_SCHEMA', () => {
    const invalidWorkload = { ...sampleWorkload, repo: undefined };
    expect(() => validateWorkloadRecord(invalidWorkload)).toThrowError(OptiGreenContractError);
    try {
      validateWorkloadRecord(invalidWorkload);
    } catch (e: any) {
      expect(e.code).toBe('E_SCHEMA');
    }
  });

  it('T03: rejects workload record with unsupported schema version with E_VERSION', () => {
    const wrongVersionWorkload = { ...sampleWorkload, version: '9.9.9' };
    expect(() => validateWorkloadRecord(wrongVersionWorkload)).toThrowError(OptiGreenContractError);
    try {
      validateWorkloadRecord(wrongVersionWorkload);
    } catch (e: any) {
      expect(e.code).toBe('E_VERSION');
    }
  });

  it('T04: validates conforming observation record with valid carbon intensity', () => {
    const observation: ObservationRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'observation',
      observation_id: 'obs-001',
      timestamp: new Date().toISOString(),
      region: 'europe-north1',
      carbon_intensity: {
        value: 42,
        unit: 'gCO2eq/kWh'
      },
      electricity_price_usd_kwh: {
        value: 0.08,
        unit: 'USD/kWh'
      },
      runner_queue_depth: 3
    };
    expect(() => validateObservationRecord(observation)).not.toThrow();
  });

  it('T05: rejects observation record with invalid measurement unit with E_UNIT', () => {
    const invalidObservation = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'observation',
      observation_id: 'obs-002',
      timestamp: new Date().toISOString(),
      region: 'us-east-1',
      carbon_intensity: {
        value: 400,
        unit: 'lbs-CO2/MWh' // Invalid unit!
      }
    };
    expect(() => validateObservationRecord(invalidObservation)).toThrowError(OptiGreenContractError);
    try {
      validateObservationRecord(invalidObservation);
    } catch (e: any) {
      expect(e.code).toBe('E_UNIT');
    }
  });

  // ---------------------------------------------------------------------------
  // Conformance Level 2: Candidate Generation & Feasibility (T06 - T13)
  // ---------------------------------------------------------------------------
  it('T06: generates candidate records spanning 4 execution dimensions', () => {
    const candidate: CandidateRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'candidate',
      candidate_id: 'cand-eu-north1-spot',
      workload_id: sampleWorkload.workload_id,
      dimensions: {
        location: { region: 'europe-north1', provider: 'gcp' },
        timing: { scheduled_start: new Date().toISOString(), deferral_seconds: 0 },
        execution_path: 'cached',
        resource_config: { instance_family: 'e2-standard-4', vcpus: 4, memory_gb: 16, pricing_mode: 'spot' }
      },
      predicted_metrics: {
        carbon_emissions_grams: 85,
        cost_usd: 0.12,
        duration_seconds: 420
      }
    };

    expect(candidate.dimensions.location.region).toBe('europe-north1');
    expect(candidate.dimensions.execution_path).toBe('cached');
    expect(candidate.dimensions.resource_config.pricing_mode).toBe('spot');
  });

  it('T07: validates candidate record schema integrity', () => {
    const candidate: CandidateRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'candidate',
      candidate_id: 'cand-001',
      workload_id: sampleWorkload.workload_id,
      dimensions: {
        location: { region: 'europe-west1', provider: 'gcp' },
        timing: { scheduled_start: new Date().toISOString(), deferral_seconds: 120 },
        execution_path: 'full',
        resource_config: { instance_family: 'c2-standard-8', vcpus: 8, memory_gb: 32, pricing_mode: 'on_demand' }
      },
      predicted_metrics: {
        carbon_emissions_grams: 190,
        cost_usd: 0.45,
        duration_seconds: 300
      }
    };
    expect(() => validateCandidateRecord(candidate)).not.toThrow();
  });

  it('T08: verifies constraint record structure and mandatory rules', () => {
    const constraints: ConstraintRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'constraint',
      constraint_id: 'con-001',
      workload_id: sampleWorkload.workload_id,
      rules: {
        allowed_regions: ['europe-west1', 'europe-north1'],
        max_duration_seconds: 600,
        max_deferral_seconds: 1800,
        max_cost_usd: 1.00
      }
    };
    expect(constraints.rules.allowed_regions).toContain('europe-north1');
  });

  it('T09: flags candidates violating mandatory constraints as infeasible', () => {
    const candidateInfeasible: CandidateRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'candidate',
      candidate_id: 'cand-disallowed-region',
      workload_id: sampleWorkload.workload_id,
      dimensions: {
        location: { region: 'us-east1', provider: 'gcp' }, // Violates allowed_regions!
        timing: { scheduled_start: new Date().toISOString(), deferral_seconds: 0 },
        execution_path: 'full',
        resource_config: { instance_family: 'e2-standard-4', vcpus: 4, memory_gb: 16, pricing_mode: 'on_demand' }
      },
      predicted_metrics: { carbon_emissions_grams: 350, cost_usd: 0.20, duration_seconds: 300 }
    };

    const constraints: ConstraintRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'constraint',
      constraint_id: 'con-002',
      workload_id: sampleWorkload.workload_id,
      rules: { allowed_regions: ['europe-north1'] }
    };

    const objectives: ObjectiveRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'objective',
      objective_id: 'obj-001',
      workload_id: sampleWorkload.workload_id,
      weights: { carbon_weight: 0.7, cost_weight: 0.2, latency_weight: 0.1 }
    };

    const decision = solveOptiGreenDecision({
      workload: sampleWorkload,
      candidates: [candidateInfeasible],
      constraints,
      objectives
    });

    expect(decision.decision).toBe('NO_FEASIBLE_SOLUTION');
    expect(decision.failure_attribution).toHaveLength(1);
    expect(decision.failure_attribution![0].violated_constraints[0]).toContain('allowed_regions');
  });

  it('T10: scores feasible candidates according to multi-objective Pareto weights', () => {
    const candLowCarbon: CandidateRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'candidate',
      candidate_id: 'cand-low-carbon',
      workload_id: sampleWorkload.workload_id,
      dimensions: {
        location: { region: 'europe-north1', provider: 'gcp' },
        timing: { scheduled_start: new Date().toISOString(), deferral_seconds: 60 },
        execution_path: 'cached',
        resource_config: { instance_family: 'e2-standard-4', vcpus: 4, memory_gb: 16, pricing_mode: 'spot' }
      },
      predicted_metrics: { carbon_emissions_grams: 40, cost_usd: 0.10, duration_seconds: 400 }
    };

    const candHighCarbonFast: CandidateRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'candidate',
      candidate_id: 'cand-fast',
      workload_id: sampleWorkload.workload_id,
      dimensions: {
        location: { region: 'europe-west1', provider: 'gcp' },
        timing: { scheduled_start: new Date().toISOString(), deferral_seconds: 0 },
        execution_path: 'full',
        resource_config: { instance_family: 'c2-standard-8', vcpus: 8, memory_gb: 32, pricing_mode: 'on_demand' }
      },
      predicted_metrics: { carbon_emissions_grams: 220, cost_usd: 0.50, duration_seconds: 150 }
    };

    const constraints: ConstraintRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'constraint',
      constraint_id: 'con-003',
      workload_id: sampleWorkload.workload_id,
      rules: { allowed_regions: ['europe-north1', 'europe-west1'] }
    };

    const carbonFirstObjectives: ObjectiveRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'objective',
      objective_id: 'obj-carbon-first',
      workload_id: sampleWorkload.workload_id,
      weights: { carbon_weight: 0.8, cost_weight: 0.1, latency_weight: 0.1 }
    };

    const decision = solveOptiGreenDecision({
      workload: sampleWorkload,
      candidates: [candLowCarbon, candHighCarbonFast],
      constraints,
      objectives: carbonFirstObjectives
    });

    expect(decision.decision).toBe('FEASIBLE');
    expect(decision.candidate_id).toBe('cand-low-carbon');
    expect(decision.evaluation_summary.feasible_candidates_count).toBe(2);
  });

  it('T11: records optimal feasible decision and selected candidate ID', () => {
    const candA: CandidateRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'candidate',
      candidate_id: 'cand-a',
      workload_id: sampleWorkload.workload_id,
      dimensions: {
        location: { region: 'europe-north1', provider: 'gcp' },
        timing: { scheduled_start: new Date().toISOString(), deferral_seconds: 0 },
        execution_path: 'cached',
        resource_config: { instance_family: 'e2-standard-4', vcpus: 4, memory_gb: 16, pricing_mode: 'spot' }
      },
      predicted_metrics: { carbon_emissions_grams: 50, cost_usd: 0.08, duration_seconds: 250 }
    };

    const decision = solveOptiGreenDecision({
      workload: sampleWorkload,
      candidates: [candA],
      constraints: {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'constraint',
        constraint_id: 'c-1',
        workload_id: sampleWorkload.workload_id,
        rules: {}
      },
      objectives: {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'objective',
        objective_id: 'o-1',
        workload_id: sampleWorkload.workload_id,
        weights: { carbon_weight: 0.5, cost_weight: 0.5, latency_weight: 0.0 }
      }
    });

    expect(decision.decision).toBe('FEASIBLE');
    expect(decision.candidate_id).toBe('cand-a');
  });

  it('T12: records first-class NO_FEASIBLE_SOLUTION when all candidates breach constraints', () => {
    const candOverBudget: CandidateRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'candidate',
      candidate_id: 'cand-over-budget',
      workload_id: sampleWorkload.workload_id,
      dimensions: {
        location: { region: 'europe-north1', provider: 'gcp' },
        timing: { scheduled_start: new Date().toISOString(), deferral_seconds: 0 },
        execution_path: 'full',
        resource_config: { instance_family: 'm2-ultramem-208', vcpus: 208, memory_gb: 5888, pricing_mode: 'on_demand' }
      },
      predicted_metrics: { carbon_emissions_grams: 800, cost_usd: 45.0, duration_seconds: 60 }
    };

    const strictConstraints: ConstraintRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'constraint',
      constraint_id: 'con-strict',
      workload_id: sampleWorkload.workload_id,
      rules: { max_cost_usd: 5.0 } // Caps at $5.00
    };

    const decision = solveOptiGreenDecision({
      workload: sampleWorkload,
      candidates: [candOverBudget],
      constraints: strictConstraints,
      objectives: {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'objective',
        objective_id: 'o-2',
        workload_id: sampleWorkload.workload_id,
        weights: { carbon_weight: 0.5, cost_weight: 0.5, latency_weight: 0 }
      }
    });

    expect(decision.decision).toBe('NO_FEASIBLE_SOLUTION');
    expect(decision.candidate_id).toBeNull();
  });

  it('T13: attributes per-candidate constraint failure reasons in NO_FEASIBLE_SOLUTION record', () => {
    const candSlow: CandidateRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'candidate',
      candidate_id: 'cand-slow',
      workload_id: sampleWorkload.workload_id,
      dimensions: {
        location: { region: 'europe-north1', provider: 'gcp' },
        timing: { scheduled_start: new Date().toISOString(), deferral_seconds: 0 },
        execution_path: 'full',
        resource_config: { instance_family: 'e2-micro', vcpus: 1, memory_gb: 1, pricing_mode: 'spot' }
      },
      predicted_metrics: { carbon_emissions_grams: 10, cost_usd: 0.01, duration_seconds: 3600 }
    };

    const deadlineConstraints: ConstraintRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'constraint',
      constraint_id: 'con-deadline',
      workload_id: sampleWorkload.workload_id,
      rules: { max_duration_seconds: 900 }
    };

    const decision = solveOptiGreenDecision({
      workload: sampleWorkload,
      candidates: [candSlow],
      constraints: deadlineConstraints,
      objectives: {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'objective',
        objective_id: 'o-3',
        workload_id: sampleWorkload.workload_id,
        weights: { carbon_weight: 1.0, cost_weight: 0, latency_weight: 0 }
      }
    });

    expect(decision.decision).toBe('NO_FEASIBLE_SOLUTION');
    expect(decision.failure_attribution).toBeDefined();
    expect(decision.failure_attribution![0].candidate_id).toBe('cand-slow');
    expect(decision.failure_attribution![0].reason).toContain('Predicted duration 3600s exceeds limit 900s');
    expect(decision.fallback_policy).toBe('DEFER');
  });

  // ---------------------------------------------------------------------------
  // Conformance Level 3: Controlled Automation, Actions & Audit (T14 - T20)
  // ---------------------------------------------------------------------------
  it('T14: creates action record with dispatch parameters from feasible decision', () => {
    const candidate: CandidateRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'candidate',
      candidate_id: 'cand-dispatch-01',
      workload_id: sampleWorkload.workload_id,
      dimensions: {
        location: { region: 'europe-west1', provider: 'gcp' },
        timing: { scheduled_start: '2026-10-30T02:00:00Z', deferral_seconds: 300 },
        execution_path: 'cached',
        resource_config: { instance_family: 'e2-standard-4', vcpus: 4, memory_gb: 16, pricing_mode: 'spot' }
      },
      predicted_metrics: { carbon_emissions_grams: 45, cost_usd: 0.05, duration_seconds: 180 }
    };

    const decision = solveOptiGreenDecision({
      workload: sampleWorkload,
      candidates: [candidate],
      constraints: {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'constraint',
        constraint_id: 'c-disp',
        workload_id: sampleWorkload.workload_id,
        rules: {}
      },
      objectives: {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'objective',
        objective_id: 'o-disp',
        workload_id: sampleWorkload.workload_id,
        weights: { carbon_weight: 1, cost_weight: 0, latency_weight: 0 }
      }
    });

    const action = createActionFromDecision(decision, sampleWorkload, candidate);
    expect(action.record_type).toBe('action');
    expect(action.dispatch_status).toBe('DISPATCHED');
    expect(action.target_region).toBe('europe-west1');
    expect(action.environment_overrides.OPTIGREEN_REGION).toBe('europe-west1');
  });

  it('T15: rejects action creation when referencing mismatched candidate with E_REF', () => {
    const candidateA: CandidateRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'candidate',
      candidate_id: 'cand-real',
      workload_id: sampleWorkload.workload_id,
      dimensions: {
        location: { region: 'europe-north1', provider: 'gcp' },
        timing: { scheduled_start: new Date().toISOString(), deferral_seconds: 0 },
        execution_path: 'full',
        resource_config: { instance_family: 'e2-standard-4', vcpus: 4, memory_gb: 16, pricing_mode: 'spot' }
      },
      predicted_metrics: { carbon_emissions_grams: 50, cost_usd: 0.1, duration_seconds: 200 }
    };

    const decision = solveOptiGreenDecision({
      workload: sampleWorkload,
      candidates: [candidateA],
      constraints: {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'constraint',
        constraint_id: 'c-ref',
        workload_id: sampleWorkload.workload_id,
        rules: {}
      },
      objectives: {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'objective',
        objective_id: 'o-ref',
        workload_id: sampleWorkload.workload_id,
        weights: { carbon_weight: 1, cost_weight: 0, latency_weight: 0 }
      }
    });

    const wrongCandidate = { ...candidateA, candidate_id: 'cand-imposter' };
    expect(() => createActionFromDecision(decision, sampleWorkload, wrongCandidate)).toThrowError(OptiGreenContractError);
    try {
      createActionFromDecision(decision, sampleWorkload, wrongCandidate);
    } catch (e: any) {
      expect(e.code).toBe('E_REF');
    }
  });

  it('T16: enforces policy check on action (data egress cost exceeds carbon value)', () => {
    const migration = evaluateCrossRegionMigration({
      originRegion: 'us-east1',
      originIntensity: 420,
      targetRegion: 'europe-north1',
      targetIntensity: 30,
      artifactSizeGb: 500, // 500 GB egress penalty = $10.00
      computeHours: 1.0,
      serverPowerKw: 1.0,
      egressCostPerGb: 0.02,
      carbonPricePerTonUsd: 50
    });

    expect(migration.allowed).toBe(false);
    expect(migration.reason).toContain('Egress penalty');
  });

  it('T17: validates outcome record schema after CI/CD job execution', () => {
    const outcome: OutcomeRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'outcome',
      outcome_id: 'out-001',
      action_id: 'act-001',
      workload_id: sampleWorkload.workload_id,
      exit_code: 0,
      actual_duration_seconds: 235,
      actual_energy_kwh: 0.42,
      actual_carbon_emissions_grams: 48.5,
      actual_cost_usd: 0.07,
      recorded_at: new Date().toISOString()
    };

    expect(() => validateOutcomeRecord(outcome)).not.toThrow();
    expect(outcome.exit_code).toBe(0);
  });

  it('T18: rejects outcome record with negative energy or emissions with E_UNIT', () => {
    const invalidOutcome = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'outcome',
      outcome_id: 'out-err',
      action_id: 'act-001',
      workload_id: sampleWorkload.workload_id,
      exit_code: 0,
      actual_duration_seconds: 200,
      actual_energy_kwh: -5.0, // Impossible negative energy!
      actual_carbon_emissions_grams: 50,
      actual_cost_usd: 0.05,
      recorded_at: new Date().toISOString()
    };

    expect(() => validateOutcomeRecord(invalidOutcome)).toThrowError(OptiGreenContractError);
    try {
      validateOutcomeRecord(invalidOutcome);
    } catch (e: any) {
      expect(e.code).toBe('E_UNIT');
    }
  });

  it('T19: creates tamper-evident SHA-256 cryptographic audit provenance chain', () => {
    const candidate: CandidateRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'candidate',
      candidate_id: 'cand-aud-1',
      workload_id: sampleWorkload.workload_id,
      dimensions: {
        location: { region: 'europe-north1', provider: 'gcp' },
        timing: { scheduled_start: new Date().toISOString(), deferral_seconds: 0 },
        execution_path: 'full',
        resource_config: { instance_family: 'e2-standard-4', vcpus: 4, memory_gb: 16, pricing_mode: 'spot' }
      },
      predicted_metrics: { carbon_emissions_grams: 30, cost_usd: 0.05, duration_seconds: 120 }
    };

    const decision = solveOptiGreenDecision({
      workload: sampleWorkload,
      candidates: [candidate],
      constraints: {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'constraint',
        constraint_id: 'c-aud',
        workload_id: sampleWorkload.workload_id,
        rules: {}
      },
      objectives: {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'objective',
        objective_id: 'o-aud',
        workload_id: sampleWorkload.workload_id,
        weights: { carbon_weight: 1, cost_weight: 0, latency_weight: 0 }
      }
    });

    const action = createActionFromDecision(decision, sampleWorkload, candidate);
    const auditRecord = createAuditProvenance(sampleWorkload, decision, action);

    expect(auditRecord.record_type).toBe('audit');
    expect(auditRecord.lifecycle_chain.workload_hash).toBe(computeRecordHash(sampleWorkload));
    expect(auditRecord.lifecycle_chain.decision_hash).toBe(computeRecordHash(decision));
    expect(auditRecord.provenance_signature).toMatch(/^[a-f0-9]{64}$/);
  });

  it('T20: verifies end-to-end full lifecycle interchange (L1 + L2 + L3)', () => {
    // 1. Ingestion (L1)
    validateWorkloadRecord(sampleWorkload);

    // 2. Candidate generation & observation (L1 -> L2)
    const candidates: CandidateRecord[] = [
      {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'candidate',
        candidate_id: 'cand-gcp-europe-north1',
        workload_id: sampleWorkload.workload_id,
        dimensions: {
          location: { region: 'europe-north1', provider: 'gcp' },
          timing: { scheduled_start: new Date().toISOString(), deferral_seconds: 0 },
          execution_path: 'cached',
          resource_config: { instance_family: 'e2-standard-4', vcpus: 4, memory_gb: 16, pricing_mode: 'spot' }
        },
        predicted_metrics: { carbon_emissions_grams: 38, cost_usd: 0.04, duration_seconds: 190 }
      }
    ];

    // 3. Multi-objective decision (L2)
    const decision = solveOptiGreenDecision({
      workload: sampleWorkload,
      candidates,
      constraints: {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'constraint',
        constraint_id: 'con-e2e',
        workload_id: sampleWorkload.workload_id,
        rules: { allowed_regions: ['europe-north1'] }
      },
      objectives: {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'objective',
        objective_id: 'obj-e2e',
        workload_id: sampleWorkload.workload_id,
        weights: { carbon_weight: 0.7, cost_weight: 0.2, latency_weight: 0.1 }
      }
    });
    expect(decision.decision).toBe('FEASIBLE');

    // 4. Action dispatch (L3)
    const action = createActionFromDecision(decision, sampleWorkload, candidates[0]);
    expect(action.dispatch_status).toBe('DISPATCHED');

    // 5. Outcome capture (L3)
    const outcome: OutcomeRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'outcome',
      outcome_id: 'out-e2e-01',
      action_id: action.action_id,
      workload_id: sampleWorkload.workload_id,
      exit_code: 0,
      actual_duration_seconds: 185,
      actual_energy_kwh: 0.35,
      actual_carbon_emissions_grams: 36.2,
      actual_cost_usd: 0.04,
      recorded_at: new Date().toISOString()
    };
    validateOutcomeRecord(outcome);

    // 6. Cryptographic audit linking (L3)
    const audit = createAuditProvenance(sampleWorkload, decision, action, outcome);
    expect(audit.lifecycle_chain.action_hash).toBe(computeRecordHash(action));
    expect(audit.lifecycle_chain.outcome_hash).toBe(computeRecordHash(outcome));
  });
});
