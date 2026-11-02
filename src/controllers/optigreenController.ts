/**
 * OptiGreen Semantic Contract & Conformance Controller
 * Executes programmatic checks T01–T20 and solves semantic contract optimization decisions.
 */

import { Request, Response } from 'express';
import {
  solveOptiGreenDecision,
  createActionFromDecision,
  createAuditProvenance,
  OPTIGREEN_CONTRACT_VERSION,
  OptiGreenContractError,
  runOptiGreenConformanceRunner
} from '../contracts/optigreenContract';

export function getConformance(req: Request, res: Response): void {
  const liveResults = runOptiGreenConformanceRunner();
  res.json({
    contractVersion: OPTIGREEN_CONTRACT_VERSION,
    specification: {
      title: 'OptiGreen: A Proposed Interoperable Semantic Contract for Carbon-, Cost-, and Latency-Aware CI/CD Optimization',
      status: 'Proposed Standard Specification v1.0.0',
      domain: 'Cloud Infrastructure & Sustainable CI/CD Systems'
    },
    conformanceLevels: {
      L1: 'Measurement (workload, observation, outcome schemas; units & timestamps)',
      L2: 'Decision (candidate generation, constraint evaluation, NO_FEASIBLE_SOLUTION attribution)',
      L3: 'Controlled Automation (action dispatch, cryptographic provenance chains, audit verification)'
    },
    conformanceTests: {
      total: liveResults.total,
      passed: liveResults.passed,
      failed: liveResults.failed,
      durationMs: liveResults.durationMs,
      suiteFile: 'test/conformanceSuite.test.ts'
    },
    conformanceExecution: liveResults
  });
}

export function solveContract(req: Request, res: Response): void {
  try {
    const { workload, observation, candidates, constraints, objectives } = req.body;
    if (!workload || !candidates || !constraints || !objectives) {
      res.status(400).json({
        error: 'Missing required OptiGreen contract inputs (workload, candidates, constraints, objectives)'
      });
      return;
    }

    const decision = solveOptiGreenDecision({
      workload,
      observation,
      candidates,
      constraints,
      objectives
    });

    let action = null;
    let audit = null;

    if (decision.decision === 'FEASIBLE') {
      const selectedCandidate = candidates.find((c: any) => c.candidate_id === decision.candidate_id);
      action = createActionFromDecision(decision, workload, selectedCandidate);
      audit = createAuditProvenance(workload, decision, action);
    } else {
      action = createActionFromDecision(decision, workload);
      audit = createAuditProvenance(workload, decision, action);
    }

    res.json({
      decision,
      action,
      audit
    });
  } catch (err: any) {
    if (err instanceof OptiGreenContractError) {
      res.status(422).json({
        error: err.message,
        code: err.code,
        details: err.details
      });
      return;
    }
    res.status(500).json({ error: err?.message || 'Internal solver error' });
  }
}
