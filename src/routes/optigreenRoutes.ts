/**
 * OptiGreen Semantic Contract & Conformance Runner Routes
 */

import { Router } from 'express';
import { getConformance, solveContract } from '../controllers/optigreenController';

const router = Router();

router.get('/optigreen/conformance', getConformance);
router.post('/optigreen/solve', solveContract);

export default router;
