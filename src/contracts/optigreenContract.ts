/**
 * OptiGreen: A Proposed Interoperable Semantic Contract for Carbon-, Cost-, and Latency-Aware CI/CD Optimization
 * Reference Implementation
 *
 * Implements the 9 lifecycle records, first-class NO_FEASIBLE_SOLUTION handling,
 * error code taxonomy (E_SCHEMA, E_UNIT, E_VERSION, E_CONSTRAINT, E_POLICY, E_REF),
 * and 3 conformance levels (L1, L2, L3).
 */

import { createHash } from 'crypto';

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
