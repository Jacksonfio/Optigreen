/**
 * OptiGreen AI-Powered Carbon-Aware CI/CD Orchestration Server
 * 
 * Clean, modular server architecture:
 * - Controllers: src/controllers/
 * - Services:    src/services/
 * - Routes:      src/routes/
 * - Contracts:   src/contracts/
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import apiRouter from './src/routes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

// Mount modular API route handlers
app.use('/api', apiRouter);

// Vite & Static Asset Serving Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app.listen(PORT, '0.0.0.0', () => {
    console.log(`OptiGreen Server running on http://0.0.0.0:${PORT}`);
  });
}

// Re-export backward-compatible services and catalogs
export { AWS_REGIONS_CATALOG, getServerSideRegionIntensity } from './src/services/regionalCarbonService';
export { generateAiSustainabilityAdvisory, proposeCandidateRerouting } from './src/services/geminiService';
export { app, startServer };

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
