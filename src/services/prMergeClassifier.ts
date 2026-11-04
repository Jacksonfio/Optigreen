/**
 * Speculative Pre-Build PR Merge Probability Engine
 * 
 * Prevents speculative energy waste by evaluating the probability that a pull request
 * will be merged without further code changes before pre-warming dependency layers.
 * Only triggers speculative pre-building when MergeProbability >= 85%.
 */

export interface PrEvaluationInput {
  prNumber: number;
  repo: string;
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
  authorMergeRatePct?: number; // e.g. 92% past PR merge rate
  isDraft: boolean;
  hasMergeConflicts: boolean;
  ciStatus?: 'SUCCESS' | 'FAILURE' | 'PENDING';
}

export interface PrPrebuildDecision {
  shouldPrebuild: boolean;
  mergeProbabilityPct: number;
  prebuildConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  energyWasteRisk: 'LOW' | 'HIGH';
  reason: string;
}

export function evaluatePrMergeProbability(input: PrEvaluationInput): PrPrebuildDecision {
  const {
    filesChanged,
    linesAdded,
    linesDeleted,
    authorMergeRatePct = 85,
    isDraft,
    hasMergeConflicts,
    ciStatus = 'PENDING'
  } = input;

  // Hard blockers for speculative pre-building
  if (isDraft) {
    return {
      shouldPrebuild: false,
      mergeProbabilityPct: 15,
      prebuildConfidence: 'LOW',
      energyWasteRisk: 'HIGH',
      reason: 'PR is in Draft state; layer pre-building deferred to avoid wasted compute energy.'
    };
  }

  if (hasMergeConflicts) {
    return {
      shouldPrebuild: false,
      mergeProbabilityPct: 10,
      prebuildConfidence: 'LOW',
      energyWasteRisk: 'HIGH',
      reason: 'Merge conflicts detected; code volatility too high for speculative artifact baking.'
    };
  }

  // Volatility scoring based on churn size
  const totalChurn = linesAdded + linesDeleted;
  let sizePenalty = 0;
  if (totalChurn > 1000 || filesChanged > 30) {
    sizePenalty = 30; // Heavy architectural PRs have high rework probability
  } else if (totalChurn > 400 || filesChanged > 15) {
    sizePenalty = 15;
  } else if (totalChurn < 100 && filesChanged < 5) {
    sizePenalty = -5; // Small, atomic PRs merge with very high confidence
  }

  let ciBonus = ciStatus === 'SUCCESS' ? 10 : ciStatus === 'FAILURE' ? -40 : 0;
  
  // Calculate final probability
  const rawProbability = authorMergeRatePct - sizePenalty + ciBonus;
  const mergeProbabilityPct = Math.max(5, Math.min(99, Math.round(rawProbability)));

  const shouldPrebuild = mergeProbabilityPct >= 85;

  return {
    shouldPrebuild,
    mergeProbabilityPct,
    prebuildConfidence: mergeProbabilityPct >= 85 ? 'HIGH' : mergeProbabilityPct >= 60 ? 'MEDIUM' : 'LOW',
    energyWasteRisk: shouldPrebuild ? 'LOW' : 'HIGH',
    reason: shouldPrebuild
      ? `High merge probability (${mergeProbabilityPct}%). Speculatively warming dependency layers during green grid window.`
      : `Merge probability (${mergeProbabilityPct}%) below the 85% safety threshold. Speculative pre-build skipped to prevent energy waste.`
  };
}
