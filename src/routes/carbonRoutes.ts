/**
 * OptiGreen Regional Carbon Telemetry Routes
 */

import { Router } from 'express';
import { getCarbonIntensity, getAllRegionsCarbon, getHistoricalReplay } from '../controllers/carbonController';

const router = Router();

router.get('/carbon-intensity', getCarbonIntensity);
router.get('/carbon/all-regions', getAllRegionsCarbon);
router.get('/carbon/historical-replay', getHistoricalReplay);

export default router;
