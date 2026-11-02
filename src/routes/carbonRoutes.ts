/**
 * OptiGreen Regional Carbon Telemetry Routes
 */

import { Router } from 'express';
import { getCarbonIntensity, getAllRegionsCarbon } from '../controllers/carbonController';

const router = Router();

router.get('/carbon-intensity', getCarbonIntensity);
router.get('/carbon/all-regions', getAllRegionsCarbon);

export default router;
