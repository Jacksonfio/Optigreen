/**
 * Central API Router
 * Aggregates all modular route handlers under the /api namespace.
 */

import { Router } from 'express';
import queueRoutes from './queueRoutes';
import carbonRoutes from './carbonRoutes';
import geminiRoutes from './geminiRoutes';
import optigreenRoutes from './optigreenRoutes';
import systemRoutes from './systemRoutes';

const apiRouter = Router();

apiRouter.use(queueRoutes);
apiRouter.use(carbonRoutes);
apiRouter.use(geminiRoutes);
apiRouter.use(optigreenRoutes);
apiRouter.use(systemRoutes);

export default apiRouter;
