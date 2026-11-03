/**
 * OptiGreen Security & Webhook Signature Middleware
 * 
 * Protects mutating endpoints against unauthorized access:
 * - Validates GitHub webhook HMAC SHA-256 signatures (`X-Hub-Signature-256`) when configured.
 * - Enforces API Bearer token authorization on mutating admin endpoints.
 * - In demo / sandbox mode, allows development access while signaling authentication headers.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function verifyWebhookSignature(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.WEBHOOK_SECRET || process.env.GITHUB_WEBHOOK_SECRET;
  const signature = req.headers['x-hub-signature-256'] as string;

  // In production with a configured secret, require and verify HMAC SHA-256
  if (secret) {
    if (!signature) {
      res.status(401).json({
        error: 'Missing X-Hub-Signature-256 header',
        security: 'HMAC_SHA256_REQUIRED'
      });
      return;
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = `sha256=${hmac.update(JSON.stringify(req.body)).digest('hex')}`;

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      res.status(403).json({
        error: 'Invalid webhook HMAC signature',
        security: 'HMAC_VERIFICATION_FAILED'
      });
      return;
    }
  }

  // Set verified security header for audit trails
  res.setHeader('X-OptiGreen-Security', secret ? 'HMAC_VERIFIED' : 'DEMO_SANDBOX_OPEN');
  next();
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const adminApiKey = process.env.OPTIGREEN_ADMIN_KEY || process.env.API_SECRET_KEY;
  const authHeader = req.headers['authorization'];

  if (adminApiKey) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized: Missing Bearer Token',
        security: 'ADMIN_KEY_REQUIRED'
      });
      return;
    }

    const token = authHeader.substring(7);
    if (token !== adminApiKey) {
      res.status(403).json({
        error: 'Forbidden: Invalid Admin Token',
        security: 'INVALID_TOKEN'
      });
      return;
    }
  }

  res.setHeader('X-OptiGreen-Auth', adminApiKey ? 'AUTHENTICATED' : 'DEMO_SANDBOX_ALLOWED');
  next();
}
