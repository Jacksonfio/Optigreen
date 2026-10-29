import { describe, it, expect, afterEach } from 'vitest';
import { isSqsConfigured, sendToSqs, receiveFromSqs, getSqsIntegrationStatus } from '../src/services/awsSqsClient';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('awsSqsClient (sandbox mode)', () => {
  it('reports SANDBOX mode when AWS credentials are not configured', () => {
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_SQS_QUEUE_URL;

    expect(isSqsConfigured()).toBe(false);
    expect(getSqsIntegrationStatus().mode).toBe('SANDBOX');
  });

  it('reports SANDBOX mode when only partial configuration exists', () => {
    process.env.AWS_REGION = 'us-east-1';
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_SQS_QUEUE_URL;

    expect(isSqsConfigured()).toBe(false);
  });

  it('sendToSqs falls back to simulated messages without touching AWS', async () => {
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_SQS_QUEUE_URL;

    const result = await sendToSqs({ repo: 'test', decision: 'PROCEED' });
    expect(result.simulated).toBe(true);
    expect(result.messageId).toMatch(/^sim-/);
    expect(result.region).toBeNull();
  });

  it('receiveFromSqs returns empty without configuration', async () => {
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_SQS_QUEUE_URL;

    expect(await receiveFromSqs(5)).toEqual([]);
  });

  it('reports LIVE mode when full configuration is present', () => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'AKIA_TEST';
    process.env.AWS_SECRET_ACCESS_KEY = 'secret';
    process.env.AWS_SQS_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789012/carbon-queue';

    expect(isSqsConfigured()).toBe(true);
    const status = getSqsIntegrationStatus();
    expect(status.mode).toBe('LIVE');
    expect(status.queueUrl).toContain('carbon-queue');
    expect(status.region).toBe('us-east-1');
  });
});