/**
 * Google Cloud Console Suite Verification
 * Verifies Cloud Run, Cloud Pub/Sub fan-out, Firestore synchronization,
 * and Artifact Registry configuration.
 */

import { describe, it, expect } from 'vitest';
import { globalGoogleCloud } from '../src/services/googleCloudClient';

describe('Google Cloud Console Suite', () => {
  it('reports production Google Cloud Run service endpoint and configuration', () => {
    const status = globalGoogleCloud.getStatus();
    expect(status.cloudRun.serviceName).toBe('optigreen-prod');
    expect(status.cloudRun.endpoint).toContain('.run.app');
    expect(status.cloudRun.containerPort).toBe(8080);
    expect(status.cloudRun.trafficPct).toBe(100);
  });

  it('publishes pipeline events to Google Cloud Pub/Sub topic', async () => {
    const event = await globalGoogleCloud.publishToPubSub({
      eventType: 'WORKLOAD_QUEUED',
      data: {
        repo: 'checkout-service',
        slaTier: 'P2_FEATURE',
        carbonIntensity: 420
      }
    });

    expect(event.eventId).toMatch(/^pubsub-/);
    expect(event.eventType).toBe('WORKLOAD_QUEUED');

    const status = globalGoogleCloud.getStatus();
    expect(status.pubsub.publishedEventsCount).toBeGreaterThan(0);
    expect(status.pubsub.topic).toContain('projects/optigreen-prod/topics/');
  });

  it('synchronizes ESG audit ledger blocks to Google Cloud Firestore', async () => {
    const syncRes = await globalGoogleCloud.syncToFirestore({
      blockIndex: 42,
      decision: 'PROCEED',
      carbonIntensity: 110,
      carbonSavedKg: 4.8
    });

    expect(syncRes.synced).toBe(true);
    expect(syncRes.docId).toBe('block-42');

    const status = globalGoogleCloud.getStatus();
    expect(status.firestore.collection).toBe('optigreen-audit-ledger');
    expect(status.firestore.synchronizedBlocksCount).toBeGreaterThan(0);
  });

  it('configures multi-region Artifact Registry for speculative Docker layer caching', () => {
    const status = globalGoogleCloud.getStatus();
    expect(status.artifactRegistry.repository).toContain('pkg.dev');
    expect(status.artifactRegistry.targetRegions).toContain('europe-north1');
    expect(status.artifactRegistry.cachingStrategy).toBe('MULTI_REGION_WARM');
  });
});
