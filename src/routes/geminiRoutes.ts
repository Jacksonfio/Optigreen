/**
 * OptiGreen Gemini 2.5 Flash AI Copilot & Optimization Routes
 */

import { Router } from 'express';
import { handleCopilot, handleAiOptimize } from '../controllers/geminiController';

const router = Router();

router.post('/gemini/copilot', handleCopilot);
router.post('/ai-optimize', handleAiOptimize);

export default router;
