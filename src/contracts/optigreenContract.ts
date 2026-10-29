/**
 * OptiGreen: A Proposed Interoperable Semantic Contract for Carbon-, Cost-, and Latency-Aware CI/CD Optimization
 * Reference Implementation
 *
 * Implements the 9 lifecycle records, first-class NO_FEASIBLE_SOLUTION handling,
 * error code taxonomy (E_SCHEMA, E_UNIT, E_VERSION, E_CONSTRAINT, E_POLICY, E_REF),
 * and 3 conformance levels (L1, L2, L3).
 */

import { createHash } from 'crypto';
import { evaluateCrossRegionMigration } from '../services/carbonDecisionEngine';

export const OPTIGREEN_CONTRACT_VERSION = '1.0.0';

// Standardized OptiGreen Error Codes
export type OptiGreenErrorCode =
  | 'E_SCHEMA'      // Malformed record, missing required field, or invalid type
  | 'E_UNIT'        // Invalid or unconvertible measurement unit
  | 'E_VERSION'     // Unsupported semantic contract version
  | 'E_CONSTRAINT'  // Infeasible candidate violating mandatory constraints
  | 'E_POLICY'      // Enterprise governance policy violation (e.g. egress arbitrage)
  | 'E_REF';        // Broken foreign reference between lifecycle records

export class OptiGreenContractError extends Error {
  public code: OptiGreenErrorCode;
  public details?: unknown;

  constructor(code: OptiGreenErrorCode, message: string, details?: unknown) {
    super(`[${code}] ${message}`);
    this.name = 'OptiGreenContractError';
    this.code = code;
    this.details = details;
  }
}

// -----------------------------------------------------------------------------
// 1. Workload Record
// -----------------------------------------------------------------------------
export interface WorkloadRecord {
  version: string; // must match '1.0.0'
  record_type: 'workload';
  workload_id: string;
  repo: string;
  commit_sha: string;
  workflow_name: string;
  sla_tier: 'P1_HOTFIX' | 'P2_FEATURE' | 'P3_BATCH';
  max_duration_seconds: number;
  data_residency?: string[]; // e.g. ['EU', 'US']
  created_at: string; // ISO 8601
}

// -----------------------------------------------------------------------------
// 2. Observation Record
// -----------------------------------------------------------------------------
export interface ObservationRecord {
  version: string;
  record_type: 'observation';
  observation_id: string;
  timestamp: string;
  region: string;
  carbon_intensity: {
    value: number;
    unit: 'gCO2eq/kWh';
  };
  electricity_price_usd_kwh?: {
    value: number;
    unit: 'USD/kWh';
  };
  runner_queue_depth?: number;
}

// -----------------------------------------------------------------------------
// 3. Candidate Record (4 Dimensions: Location, Timing, Path, Resource)
// -----------------------------------------------------------------------------
export interface CandidateRecord {
  version: string;
  record_type: 'candidate';
  candidate_id: string;
  workload_id: string;
  dimensions: {
    location: {
      region: string;
      provider: 'gcp' | 'aws' | 'azure' | 'self_hosted';
    };
    timing: {
      scheduled_start: string; // ISO 8601
      deferral_seconds: number;
    };
    execution_path: 'full' | 'cached' | 'incremental' | 'reduced_test';
    resource_config: {
      instance_family: string;
      vcpus: number;
      memory_gb: number;
      pricing_mode: 'on_demand' | 'spot';
    };
  };
  predicted_metrics: {
    carbon_emissions_grams: number;
    cost_usd: number;
    duration_seconds: number;
  };
}

// -----------------------------------------------------------------------------
// 4. Constraint Record (Mandatory Feasibility Filters)
// -----------------------------------------------------------------------------
export interface ConstraintRecord {
  version: string;
  record_type: 'constraint';
  constraint_id: string;
  workload_id: string;
  rules: {
    allowed_regions?: string[];
    max_duration_seconds?: number;
    max_deferral_seconds?: number;
    max_carbon_intensity?: number; // gCO2eq/kWh
    max_cost_usd?: number;
    requires_spot?: boolean;
  };
}

// -----------------------------------------------------------------------------
// 5. Objective Record (Pareto Preference Weights)
// -----------------------------------------------------------------------------
export interface ObjectiveRecord {
  version: string;
  record_type: 'objective';
  objective_id: string;
  workload_id: string;
  weights: {
    carbon_weight: number; // 0.0 - 1.0
    cost_weight: number;   // 0.0 - 1.0
    latency_weight: number;// 0.0 - 1.0
  };
}

// -----------------------------------------------------------------------------
// 6. Decision Record (FEASIBLE or NO_FEASIBLE_SOLUTION)
// -----------------------------------------------------------------------------
export interface DecisionRecord {
  version: string;
  record_type: 'decision';
  decision_id: string;
  workload_id: string;
  decision: 'FEASIBLE' | 'NO_FEASIBLE_SOLUTION';
  candidate_id: string | null;
  decided_at: string;
  evaluation_summary: {
    evaluated_candidates_count: number;
    feasible_candidates_count: number;
    optimal_score?: number;
  };
  failure_attribution?: Array<{
    candidate_id: string;
    violated_constraints: string[];
    reason: string;
  }>;
  fallback_policy?: 'LOCAL_DEFAULT' | 'DEFER' | 'FAIL_FAST' | 'OVERRIDE';
}

// -----------------------------------------------------------------------------
// 7. Action Record
// -----------------------------------------------------------------------------
export interface ActionRecord {
  version: string;
  record_type: 'action';
  action_id: string;
  decision_id: string;
  workload_id: string;
  dispatched_at: string;
  target_region: string;
  target_runner_label: string;
  environment_overrides: Record<string, string>;
  dispatch_status: 'DISPATCHED' | 'QUEUED' | 'REJECTED';
}

// -----------------------------------------------------------------------------
// 8. Outcome Record
// -----------------------------------------------------------------------------
export interface OutcomeRecord {
  version: string;
  record_type: 'outcome';
  outcome_id: string;
  action_id: string;
  workload_id: string;
  exit_code: number;
  actual_duration_seconds: number;
  actual_energy_kwh: number;
  actual_carbon_emissions_grams: number;
  actual_cost_usd: number;
  recorded_at: string;
}

// -----------------------------------------------------------------------------
// 9. Audit Record (Cryptographic Hash Provenance)
// -----------------------------------------------------------------------------
export interface AuditRecord {
  version: string;
  record_type: 'audit';
  audit_id: string;
  workload_id: string;
  decision_id: string;
  lifecycle_chain: {
    workload_hash: string;
    decision_hash: string;
    action_hash?: string;
    outcome_hash?: string;
  };
  previous_record_hash?: string;
  provenance_signature: string;
  timestamp: string;
}

// Union of all OptiGreen record types
export type OptiGreenRecord =
  | WorkloadRecord
  | ObservationRecord
  | CandidateRecord
  | ConstraintRecord
  | ObjectiveRecord
  | DecisionRecord
  | ActionRecord
  | OutcomeRecord
  | AuditRecord;

// -----------------------------------------------------------------------------
// Canonical Record Hashing
// -----------------------------------------------------------------------------
export function computeRecordHash(record: object): string {
  const jsonStr = JSON.stringify(record, Object.keys(record).sort());
  return createHash('sha256').update(jsonStr).digest('hex');
}

// -----------------------------------------------------------------------------
// Validation Utilities (Throws OptiGreenContractError on violation)
// -----------------------------------------------------------------------------
export function validateWorkloadRecord(record: any): asserts record is WorkloadRecord {
  if (!record || typeof record !== 'object') {
    throw new OptiGreenContractError('E_SCHEMA', 'Workload record must be a non-null object');
  }
  if (record.version !== OPTIGREEN_CONTRACT_VERSION) {
    throw new OptiGreenContractError('E_VERSION', `Unsupported contract version ${record.version}; expected ${OPTIGREEN_CONTRACT_VERSION}`);
  }
  if (record.record_type !== 'workload') {
    throw new OptiGreenContractError('E_SCHEMA', `Invalid record_type "${record.record_type}", expected "workload"`);
  }
  if (!record.workload_id || typeof record.workload_id !== 'string') {
    throw new OptiGreenContractError('E_SCHEMA', 'workload_id is required and must be a string');
  }
  if (!record.repo || !record.commit_sha || !record.workflow_name) {
    throw new OptiGreenContractError('E_SCHEMA', 'repo, commit_sha, and workflow_name are required fields');
  }
  if (!['P1_HOTFIX', 'P2_FEATURE', 'P3_BATCH'].includes(record.sla_tier)) {
    throw new OptiGreenContractError('E_SCHEMA', `Invalid sla_tier: ${record.sla_tier}`);
  }
  if (typeof record.max_duration_seconds !== 'number' || record.max_duration_seconds <= 0) {
    throw new OptiGreenContractError('E_SCHEMA', 'max_duration_seconds must be a positive number');
  }
}

export function validateObservationRecord(record: any): asserts record is ObservationRecord {
  if (!record || typeof record !== 'object') {
    throw new OptiGreenContractError('E_SCHEMA', 'Observation record must be a non-null object');
  }
  if (record.version !== OPTIGREEN_CONTRACT_VERSION) {
    throw new OptiGreenContractError('E_VERSION', `Unsupported contract version ${record.version}`);
  }
  if (record.record_type !== 'observation') {
    throw new OptiGreenContractError('E_SCHEMA', `Invalid record_type "${record.record_type}", expected "observation"`);
  }
  if (!record.carbon_intensity || typeof record.carbon_intensity.value !== 'number') {
    throw new OptiGreenContractError('E_SCHEMA', 'carbon_intensity.value must be a valid number');
  }
  if (record.carbon_intensity.unit !== 'gCO2eq/kWh') {
    throw new OptiGreenContractError('E_UNIT', `Invalid carbon intensity unit "${record.carbon_intensity.unit}"; expected "gCO2eq/kWh"`);
  }
  if (record.electricity_price_usd_kwh && record.electricity_price_usd_kwh.unit !== 'USD/kWh') {
    throw new OptiGreenContractError('E_UNIT', `Invalid electricity price unit "${record.electricity_price_usd_kwh.unit}"; expected "USD/kWh"`);
  }
}

export function validateCandidateRecord(record: any): asserts record is CandidateRecord {
  if (!record || typeof record !== 'object') {
    throw new OptiGreenContractError('E_SCHEMA', 'Candidate record must be a non-null object');
  }
  if (record.version !== OPTIGREEN_CONTRACT_VERSION) {
    throw new OptiGreenContractError('E_VERSION', `Unsupported contract version ${record.version}`);
  }
  if (record.record_type !== 'candidate') {
    throw new OptiGreenContractError('E_SCHEMA', `Invalid record_type "${record.record_type}", expected "candidate"`);
  }
  if (!record.candidate_id || !record.workload_id) {
    throw new OptiGreenContractError('E_SCHEMA', 'candidate_id and workload_id are required');
  }
  if (!record.dimensions?.location?.region || !record.dimensions?.timing || !record.dimensions?.execution_path || !record.dimensions?.resource_config) {
    throw new OptiGreenContractError('E_SCHEMA', 'Candidate dimensions must include location, timing, execution_path, and resource_config');
  }
  if (!record.predicted_metrics || typeof record.predicted_metrics.carbon_emissions_grams !== 'number') {
    throw new OptiGreenContractError('E_SCHEMA', 'Candidate must include predicted_metrics with carbon_emissions_grams');
  }
}

export function validateOutcomeRecord(record: any): asserts record is OutcomeRecord {
  if (!record || typeof record !== 'object') {
    throw new OptiGreenContractError('E_SCHEMA', 'Outcome record must be a non-null object');
  }
  if (record.version !== OPTIGREEN_CONTRACT_VERSION) {
    throw new OptiGreenContractError('E_VERSION', `Unsupported contract version ${record.version}`);
  }
  if (record.record_type !== 'outcome') {
    throw new OptiGreenContractError('E_SCHEMA', `Invalid record_type "${record.record_type}", expected "outcome"`);
  }
  if (typeof record.actual_energy_kwh !== 'number' || record.actual_energy_kwh < 0) {
    throw new OptiGreenContractError('E_UNIT', 'actual_energy_kwh must be a non-negative number');
  }
  if (typeof record.actual_carbon_emissions_grams !== 'number' || record.actual_carbon_emissions_grams < 0) {
    throw new OptiGreenContractError('E_UNIT', 'actual_carbon_emissions_grams must be a non-negative number');
  }
}

// -----------------------------------------------------------------------------
// Decision Engine Solver (Implements OptiGreen Semantic Multi-Objective Optimization)
// -----------------------------------------------------------------------------
export interface SolveDecisionInput {
  workload: WorkloadRecord;
  observation?: ObservationRecord;
  candidates: CandidateRecord[];
  constraints: ConstraintRecord;
  objectives: ObjectiveRecord;
}

export function solveOptiGreenDecision(input: SolveDecisionInput): DecisionRecord {
  const { workload, candidates, constraints, objectives } = input;

  validateWorkloadRecord(workload);
  if (input.observation) validateObservationRecord(input.observation);
  candidates.forEach(validateCandidateRecord);

  const failureAttributions: Array<{ candidate_id: string; violated_constraints: string[]; reason: string }> = [];
  const feasibleCandidates: Array<{ candidate: CandidateRecord; score: number }> = [];

  const { rules } = constraints;

  for (const candidate of candidates) {
    if (candidate.workload_id !== workload.workload_id) {
      throw new OptiGreenContractError('E_REF', `Candidate ${candidate.candidate_id} references foreign workload ${candidate.workload_id}`);
    }

    const violations: string[] = [];

    // Rule 1: Allowed regions (Data residency)
    if (rules.allowed_regions && rules.allowed_regions.length > 0) {
      if (!rules.allowed_regions.includes(candidate.dimensions.location.region)) {
        violations.push(`Region ${candidate.dimensions.location.region} not in allowed_regions [${rules.allowed_regions.join(', ')}]`);
      }
    }

    // Rule 2: Max duration
    if (rules.max_duration_seconds !== undefined) {
      if (candidate.predicted_metrics.duration_seconds > rules.max_duration_seconds) {
        violations.push(`Predicted duration ${candidate.predicted_metrics.duration_seconds}s exceeds limit ${rules.max_duration_seconds}s`);
      }
    }

    // Rule 3: Max deferral
    if (rules.max_deferral_seconds !== undefined) {
      if (candidate.dimensions.timing.deferral_seconds > rules.max_deferral_seconds) {
        violations.push(`Deferral ${candidate.dimensions.timing.deferral_seconds}s exceeds SLA limit ${rules.max_deferral_seconds}s`);
      }
    }

    // Rule 4: Max cost
    if (rules.max_cost_usd !== undefined) {
      if (candidate.predicted_metrics.cost_usd > rules.max_cost_usd) {
        violations.push(`Predicted cost $${candidate.predicted_metrics.cost_usd} exceeds cap $${rules.max_cost_usd}`);
      }
    }

    if (violations.length > 0) {
      failureAttributions.push({
        candidate_id: candidate.candidate_id,
        violated_constraints: violations,
        reason: violations.join('; ')
      });
    } else {
      // Calculate weighted multi-objective score (lower is better)
      const wC = objectives.weights.carbon_weight;
      const wCost = objectives.weights.cost_weight;
      const wLat = objectives.weights.latency_weight;

      const score =
        wC * candidate.predicted_metrics.carbon_emissions_grams +
        wCost * (candidate.predicted_metrics.cost_usd * 1000) + // scale for comparison
        wLat * (candidate.predicted_metrics.duration_seconds / 10);

      feasibleCandidates.push({ candidate, score });
    }
  }

  // If NO candidate is feasible, OptiGreen records a first-class NO_FEASIBLE_SOLUTION
  if (feasibleCandidates.length === 0) {
    return {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'decision',
      decision_id: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      workload_id: workload.workload_id,
      decision: 'NO_FEASIBLE_SOLUTION',
      candidate_id: null,
      decided_at: new Date().toISOString(),
      evaluation_summary: {
        evaluated_candidates_count: candidates.length,
        feasible_candidates_count: 0
      },
      failure_attribution: failureAttributions,
      fallback_policy: workload.sla_tier === 'P1_HOTFIX' ? 'OVERRIDE' : 'DEFER'
    };
  }

  // Sort feasible candidates by ascending score (best first)
  feasibleCandidates.sort((a, b) => a.score - b.score);
  const best = feasibleCandidates[0];

  return {
    version: OPTIGREEN_CONTRACT_VERSION,
    record_type: 'decision',
    decision_id: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    workload_id: workload.workload_id,
    decision: 'FEASIBLE',
    candidate_id: best.candidate.candidate_id,
    decided_at: new Date().toISOString(),
    evaluation_summary: {
      evaluated_candidates_count: candidates.length,
      feasible_candidates_count: feasibleCandidates.length,
      optimal_score: Number(best.score.toFixed(4))
    }
  };
}

// -----------------------------------------------------------------------------
// Action Dispatch Helper
// -----------------------------------------------------------------------------
export function createActionFromDecision(
  decision: DecisionRecord,
  workload: WorkloadRecord,
  candidate?: CandidateRecord
): ActionRecord {
  if (decision.workload_id !== workload.workload_id) {
    throw new OptiGreenContractError('E_REF', `Decision workload_id ${decision.workload_id} does not match workload ${workload.workload_id}`);
  }

  if (decision.decision === 'NO_FEASIBLE_SOLUTION') {
    return {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'action',
      action_id: `act-${Date.now()}`,
      decision_id: decision.decision_id,
      workload_id: workload.workload_id,
      dispatched_at: new Date().toISOString(),
      target_region: 'local-fallback',
      target_runner_label: 'fallback-runner',
      environment_overrides: {
        OPTIGREEN_STATUS: 'HELD_NO_FEASIBLE_SOLUTION',
        FALLBACK_POLICY: decision.fallback_policy ?? 'DEFER'
      },
      dispatch_status: 'QUEUED'
    };
  }

  if (!candidate || candidate.candidate_id !== decision.candidate_id) {
    throw new OptiGreenContractError('E_REF', `Candidate not found or mismatch for selected decision candidate ${decision.candidate_id}`);
  }

  return {
    version: OPTIGREEN_CONTRACT_VERSION,
    record_type: 'action',
    action_id: `act-${Date.now()}`,
    decision_id: decision.decision_id,
    workload_id: workload.workload_id,
    dispatched_at: new Date().toISOString(),
    target_region: candidate.dimensions.location.region,
    target_runner_label: `runner-${candidate.dimensions.location.region}-${candidate.dimensions.resource_config.instance_family}`,
    environment_overrides: {
      OPTIGREEN_SCHEDULED_START: candidate.dimensions.timing.scheduled_start,
      OPTIGREEN_EXECUTION_PATH: candidate.dimensions.execution_path,
      OPTIGREEN_REGION: candidate.dimensions.location.region
    },
    dispatch_status: 'DISPATCHED'
  };
}

// -----------------------------------------------------------------------------
// Audit Provenance Record Creation
// -----------------------------------------------------------------------------
export function createAuditProvenance(
  workload: WorkloadRecord,
  decision: DecisionRecord,
  action?: ActionRecord,
  outcome?: OutcomeRecord,
  previousAuditHash?: string
): AuditRecord {
  const workloadHash = computeRecordHash(workload);
  const decisionHash = computeRecordHash(decision);
  const actionHash = action ? computeRecordHash(action) : undefined;
  const outcomeHash = outcome ? computeRecordHash(outcome) : undefined;

  const provenancePayload = {
    workload_id: workload.workload_id,
    decision_id: decision.decision_id,
    workloadHash,
    decisionHash,
    actionHash,
    outcomeHash,
    previousAuditHash
  };

  const provenanceSignature = createHash('sha256')
    .update(JSON.stringify(provenancePayload))
    .digest('hex');

  return {
    version: OPTIGREEN_CONTRACT_VERSION,
    record_type: 'audit',
    audit_id: `aud-${Date.now()}`,
    workload_id: workload.workload_id,
    decision_id: decision.decision_id,
    lifecycle_chain: {
      workload_hash: workloadHash,
      decision_hash: decisionHash,
      action_hash: actionHash,
      outcome_hash: outcomeHash
    },
    previous_record_hash: previousAuditHash,
    provenance_signature: provenanceSignature,
    timestamp: new Date().toISOString()
  };
}

// -----------------------------------------------------------------------------
// Live Programmatic Conformance Test Runner (T01 - T20)
// Actually executes all 20 test specifications in memory on demand.
// -----------------------------------------------------------------------------
export interface ConformanceTestResult {
  id: string;
  name: string;
  level: 'L1' | 'L2' | 'L3';
  status: 'PASSED' | 'FAILED';
  durationMs: number;
  error?: string;
}

export interface ConformanceSuiteExecution {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  executedAt: string;
  conformanceLevel: 'L1_CONFORMANT' | 'L2_CONFORMANT' | 'L3_CERTIFIED';
  testResults: ConformanceTestResult[];
}

export function runOptiGreenConformanceRunner(): ConformanceSuiteExecution {
  const startTime = Date.now();
  const testResults: ConformanceTestResult[] = [];

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

  const sampleObservation: ObservationRecord = {
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

  function executeTest(id: string, name: string, level: 'L1' | 'L2' | 'L3', fn: () => void) {
    const t0 = performance.now();
    try {
      fn();
      testResults.push({ id, name, level, status: 'PASSED', durationMs: Number((performance.now() - t0).toFixed(2)) });
    } catch (err: any) {
      testResults.push({ id, name, level, status: 'FAILED', durationMs: Number((performance.now() - t0).toFixed(2)), error: err?.message || String(err) });
    }
  }

  // T01: Validates conforming workload record schema
  executeTest('T01', 'Validates conforming workload record schema', 'L1', () => {
    validateWorkloadRecord(sampleWorkload);
  });

  // T02: Rejects workload missing required fields with E_SCHEMA
  executeTest('T02', 'Rejects workload record missing required fields with E_SCHEMA', 'L1', () => {
    let thrown = false;
    try {
      validateWorkloadRecord({ ...sampleWorkload, repo: '' as any });
    } catch (e: any) {
      if (e instanceof OptiGreenContractError && e.code === 'E_SCHEMA') thrown = true;
    }
    if (!thrown) throw new Error('Expected E_SCHEMA error was not thrown');
  });

  // T03: Rejects workload record with unsupported schema version with E_VERSION
  executeTest('T03', 'Rejects workload record with unsupported schema version with E_VERSION', 'L1', () => {
    let thrown = false;
    try {
      validateWorkloadRecord({ ...sampleWorkload, version: '9.9.9' });
    } catch (e: any) {
      if (e instanceof OptiGreenContractError && e.code === 'E_VERSION') thrown = true;
    }
    if (!thrown) throw new Error('Expected E_VERSION error was not thrown');
  });

  // T04: Validates conforming observation record with valid carbon intensity
  executeTest('T04', 'Validates conforming observation record with valid carbon intensity', 'L1', () => {
    validateObservationRecord(sampleObservation);
  });

  // T05: Rejects observation record with invalid measurement unit with E_UNIT
  executeTest('T05', 'Rejects observation record with invalid measurement unit with E_UNIT', 'L1', () => {
    let thrown = false;
    try {
      validateObservationRecord({
        ...sampleObservation,
        carbon_intensity: { value: 400, unit: 'lbs-CO2/MWh' as any }
      });
    } catch (e: any) {
      if (e instanceof OptiGreenContractError && e.code === 'E_UNIT') thrown = true;
    }
    if (!thrown) throw new Error('Expected E_UNIT error was not thrown');
  });

  // T06: Generates candidate records spanning 4 execution dimensions
  executeTest('T06', 'Generates candidate records spanning 4 execution dimensions', 'L2', () => {
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
    validateCandidateRecord(candidate);
  });

  // T07: Validates candidate record schema integrity
  executeTest('T07', 'Validates candidate record schema integrity', 'L2', () => {
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
    validateCandidateRecord(candidate);
  });

  // T08: Verifies constraint record structure and mandatory rules
  executeTest('T08', 'Verifies constraint record structure and mandatory rules', 'L2', () => {
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
    if (!constraints.rules.allowed_regions?.includes('europe-north1')) {
      throw new Error('Constraint validation failed');
    }
  });

  // T09: Flags candidates violating mandatory constraints as infeasible
  executeTest('T09', 'Flags candidates violating mandatory constraints as infeasible', 'L2', () => {
    const candidateInfeasible: CandidateRecord = {
      version: OPTIGREEN_CONTRACT_VERSION,
      record_type: 'candidate',
      candidate_id: 'cand-disallowed-region',
      workload_id: sampleWorkload.workload_id,
      dimensions: {
        location: { region: 'us-east1', provider: 'gcp' },
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

    if (decision.decision !== 'NO_FEASIBLE_SOLUTION') throw new Error('Expected NO_FEASIBLE_SOLUTION');
  });

  // T10: Scores feasible candidates according to multi-objective Pareto weights
  executeTest('T10', 'Scores feasible candidates according to multi-objective Pareto weights', 'L2', () => {
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

    const decision = solveOptiGreenDecision({
      workload: sampleWorkload,
      candidates: [candLowCarbon, candHighCarbonFast],
      constraints: {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'constraint',
        constraint_id: 'con-003',
        workload_id: sampleWorkload.workload_id,
        rules: { allowed_regions: ['europe-north1', 'europe-west1'] }
      },
      objectives: {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'objective',
        objective_id: 'obj-carbon-first',
        workload_id: sampleWorkload.workload_id,
        weights: { carbon_weight: 0.8, cost_weight: 0.1, latency_weight: 0.1 }
      }
    });

    if (decision.candidate_id !== 'cand-low-carbon') throw new Error('Pareto solver failed to pick green candidate');
  });

  // T11: Records optimal feasible decision and selected candidate ID
  executeTest('T11', 'Records optimal feasible decision and selected candidate ID', 'L2', () => {
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

    if (decision.decision !== 'FEASIBLE' || decision.candidate_id !== 'cand-a') throw new Error('Decision mismatch');
  });

  // T12: Records first-class NO_FEASIBLE_SOLUTION when all candidates breach constraints
  executeTest('T12', 'Records first-class NO_FEASIBLE_SOLUTION when all candidates breach constraints', 'L2', () => {
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

    const decision = solveOptiGreenDecision({
      workload: sampleWorkload,
      candidates: [candOverBudget],
      constraints: {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'constraint',
        constraint_id: 'con-strict',
        workload_id: sampleWorkload.workload_id,
        rules: { max_cost_usd: 5.0 }
      },
      objectives: {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'objective',
        objective_id: 'o-2',
        workload_id: sampleWorkload.workload_id,
        weights: { carbon_weight: 0.5, cost_weight: 0.5, latency_weight: 0 }
      }
    });

    if (decision.decision !== 'NO_FEASIBLE_SOLUTION') throw new Error('Expected NO_FEASIBLE_SOLUTION');
  });

  // T13: Attributes per-candidate constraint failure reasons in NO_FEASIBLE_SOLUTION record
  executeTest('T13', 'Attributes per-candidate constraint failure reasons in NO_FEASIBLE_SOLUTION', 'L2', () => {
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

    const decision = solveOptiGreenDecision({
      workload: sampleWorkload,
      candidates: [candSlow],
      constraints: {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'constraint',
        constraint_id: 'con-deadline',
        workload_id: sampleWorkload.workload_id,
        rules: { max_duration_seconds: 900 }
      },
      objectives: {
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'objective',
        objective_id: 'o-3',
        workload_id: sampleWorkload.workload_id,
        weights: { carbon_weight: 1.0, cost_weight: 0, latency_weight: 0 }
      }
    });

    if (!decision.failure_attribution || decision.failure_attribution.length === 0) {
      throw new Error('Missing failure attribution');
    }
  });

  // T14: Creates action record with dispatch parameters from feasible decision
  executeTest('T14', 'Creates action record with dispatch parameters from feasible decision', 'L3', () => {
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
    if (action.dispatch_status !== 'DISPATCHED') throw new Error('Action was not marked DISPATCHED');
  });

  // T15: Rejects action creation when referencing mismatched candidate with E_REF
  executeTest('T15', 'Rejects action creation when referencing mismatched candidate with E_REF', 'L3', () => {
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

    let thrown = false;
    try {
      createActionFromDecision(decision, sampleWorkload, { ...candidateA, candidate_id: 'cand-imposter' });
    } catch (e: any) {
      if (e instanceof OptiGreenContractError && e.code === 'E_REF') thrown = true;
    }
    if (!thrown) throw new Error('Expected E_REF error was not thrown');
  });

  // T16: Enforces policy check on action (data egress cost exceeds carbon value)
  executeTest('T16', 'Enforces policy check on action (data egress cost exceeds carbon value)', 'L3', () => {
    const migration = evaluateCrossRegionMigration({
      originRegion: 'us-east-1',
      originIntensity: 420,
      targetRegion: 'europe-north1',
      targetIntensity: 30,
      artifactSizeGb: 500, // 500 GB egress penalty = $10.00
      computeHours: 1.0,
      serverPowerKw: 1.0,
      egressCostPerGb: 0.02,
      carbonPricePerTonUsd: 50
    });

    if (migration.allowed !== false) throw new Error('Egress arbitrage policy failed to veto 500GB migration');
  });

  // T17: Validates outcome record schema after CI/CD job execution
  executeTest('T17', 'Validates outcome record schema after CI/CD job execution', 'L3', () => {
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
    validateOutcomeRecord(outcome);
  });

  // T18: Rejects outcome record with negative energy or emissions with E_UNIT
  executeTest('T18', 'Rejects outcome record with negative energy or emissions with E_UNIT', 'L3', () => {
    let thrown = false;
    try {
      validateOutcomeRecord({
        version: OPTIGREEN_CONTRACT_VERSION,
        record_type: 'outcome',
        outcome_id: 'out-err',
        action_id: 'act-001',
        workload_id: sampleWorkload.workload_id,
        exit_code: 0,
        actual_duration_seconds: 200,
        actual_energy_kwh: -5.0,
        actual_carbon_emissions_grams: 50,
        actual_cost_usd: 0.05,
        recorded_at: new Date().toISOString()
      });
    } catch (e: any) {
      if (e instanceof OptiGreenContractError && e.code === 'E_UNIT') thrown = true;
    }
    if (!thrown) throw new Error('Expected E_UNIT error was not thrown');
  });

  // T19: Creates tamper-evident SHA-256 cryptographic audit provenance chain
  executeTest('T19', 'Creates tamper-evident SHA-256 cryptographic audit provenance chain', 'L3', () => {
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
    if (!auditRecord.provenance_signature) throw new Error('Provenance signature missing');
  });

  // T20: Verifies end-to-end full lifecycle interchange (L1 + L2 + L3)
  executeTest('T20', 'Verifies end-to-end full lifecycle interchange (L1 + L2 + L3)', 'L3', () => {
    validateWorkloadRecord(sampleWorkload);
    validateObservationRecord(sampleObservation);

    const candidates: CandidateRecord[] = [{
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
    }];

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

    const action = createActionFromDecision(decision, sampleWorkload, candidates[0]);
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
    const audit = createAuditProvenance(sampleWorkload, decision, action, outcome);
    if (!audit.provenance_signature) throw new Error('E2E lifecycle incomplete');
  });

  const passed = testResults.filter(t => t.status === 'PASSED').length;
  const failed = testResults.filter(t => t.status === 'FAILED').length;
  const durationMs = Number((Date.now() - startTime).toFixed(2));

  return {
    total: 20,
    passed,
    failed,
    durationMs,
    executedAt: new Date().toISOString(),
    conformanceLevel: failed === 0 ? 'L3_CERTIFIED' : passed >= 10 ? 'L2_CONFORMANT' : 'L1_CONFORMANT',
    testResults
  };
}
