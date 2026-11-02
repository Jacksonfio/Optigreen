/**
 * OptiGreen Gemini AI Controller
 * Handles interactive Copilot conversations, multi-turn tool-calling,
 * and AI sustainability advisories.
 */

import { Request, Response } from 'express';
import { runCopilotMultiTurn, generateAiSustainabilityAdvisory } from '../services/geminiService';

export async function handleCopilot(req: Request, res: Response): Promise<void> {
  const { prompt, mode = 'advisor', history = [] } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Missing required string parameter: prompt' });
    return;
  }

  try {
    const result = await runCopilotMultiTurn(prompt, mode, history);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Gemini Copilot execution error' });
  }
}

export async function handleAiOptimize(req: Request, res: Response): Promise<void> {
  try {
    const result = await generateAiSustainabilityAdvisory();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Gemini AI optimization advisory error' });
  }
}
