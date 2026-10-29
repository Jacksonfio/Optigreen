import { describe, it, expect, vi, afterEach } from 'vitest';
import { DeploymentErrorInterceptor } from '../src/services/deploymentInterceptor';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DeploymentErrorInterceptor', () => {
  it('executes a healthy operation on the first attempt', async () => {
    const interceptor = new DeploymentErrorInterceptor(3, 100);
    const op = vi.fn().mockResolvedValue('ok');

    const result = await interceptor.executeWithInterceptor(op, 'SQS_QUEUE', 'test-queue');

    expect(result.result).toBe('ok');
    expect(result.recovered).toBe(false);
    expect(result.attempts).toBe(1);
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('recovers with exponential backoff after transient failures', async () => {
    const interceptor = new DeploymentErrorInterceptor(3, 10);
    const op = vi.fn().mockRejectedValueOnce(new Error('SQS_CONNECTION_ERROR: ECONNRESET')).mockResolvedValue('recovered');

    const result = await interceptor.executeWithInterceptor(op, 'SQS_QUEUE', 'test-queue');

    expect(result.result).toBe('recovered');
    expect(result.recovered).toBe(true);
    expect(result.attempts).toBe(2);
    expect(interceptor.getMetrics().successfulRecoveries).toBe(1);
  });

  it('gives up and reports the error after max retries', async () => {
    const interceptor = new DeploymentErrorInterceptor(2, 10);
    const op = vi.fn().mockRejectedValue(new Error('ETIMEDOUT: timeout'));

    const result = await interceptor.executeWithInterceptor(op, 'ELECTRICITY_MAPS_API', 'grid-api');

    expect(result.result).toBeNull();
    expect(result.recovered).toBe(false);
    expect(result.attempts).toBe(2);
    expect(interceptor.getMetrics().failedRetries).toBe(1);
  });

  it('trips the circuit breaker after 3 consecutive failures', async () => {
    const interceptor = new DeploymentErrorInterceptor(1, 1);
    const op = vi.fn().mockRejectedValue(new Error('SQS_CONNECTION_ERROR: ECONNRESET'));

    await interceptor.executeWithInterceptor(op, 'SQS_QUEUE', 'q1');
    await interceptor.executeWithInterceptor(op, 'SQS_QUEUE', 'q2');
    await interceptor.executeWithInterceptor(op, 'SQS_QUEUE', 'q3');

    expect(interceptor.getMetrics().circuitBreakerState).toBe('OPEN');
  });

  it('rejects operations immediately while the circuit is open', async () => {
    const interceptor = new DeploymentErrorInterceptor(1, 1);
    const op = vi.fn().mockRejectedValue(new Error('SQS_CONNECTION_ERROR: ECONNRESET'));

    await interceptor.executeWithInterceptor(op, 'SQS_QUEUE', 'q1');
    await interceptor.executeWithInterceptor(op, 'SQS_QUEUE', 'q2');
    await interceptor.executeWithInterceptor(op, 'SQS_QUEUE', 'q3');
    expect(interceptor.getMetrics().circuitBreakerState).toBe('OPEN');

    // While OPEN, the operation must not even be invoked
    const blocked = await interceptor.executeWithInterceptor(op, 'SQS_QUEUE', 'q4');
    expect(blocked.result).toBeNull();
    expect(blocked.error).toContain('Circuit Breaker is OPEN');
  });

  it('computes strictly increasing exponential backoff with jitter', () => {
    const interceptor = new DeploymentErrorInterceptor(5, 100);
    const d1 = interceptor.calculateBackoff(1);
    const d2 = interceptor.calculateBackoff(2);
    const d3 = interceptor.calculateBackoff(3);

    expect(d1).toBeGreaterThanOrEqual(80);
    expect(d1).toBeLessThanOrEqual(120);
    expect(d2).toBeGreaterThan(d1);
    expect(d3).toBeGreaterThan(d2);
    expect(d3).toBeLessThanOrEqual(5000);
  });

  it('resetCircuitBreaker returns the circuit to CLOSED and clears metrics', async () => {
    const interceptor = new DeploymentErrorInterceptor(1, 1);
    const op = vi.fn().mockRejectedValue(new Error('SQS_CONNECTION_ERROR: ECONNRESET'));

    await interceptor.executeWithInterceptor(op, 'SQS_QUEUE', 'q1');
    await interceptor.executeWithInterceptor(op, 'SQS_QUEUE', 'q2');
    await interceptor.executeWithInterceptor(op, 'SQS_QUEUE', 'q3');
    expect(interceptor.getMetrics().circuitBreakerState).toBe('OPEN');

    interceptor.resetCircuitBreaker();
    expect(interceptor.getMetrics().circuitBreakerState).toBe('CLOSED');
    expect(interceptor.getMetrics().sqsConnectionStatus).toBe('HEALTHY');
  });
});