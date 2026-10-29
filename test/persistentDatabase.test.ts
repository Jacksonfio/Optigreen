/**
 * Persistent Database Verification Suite
 * Verifies that workloads, activities, and settings persist across
 * simulated restarts and reloads without data loss.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { PersistentDatabase } from '../src/services/persistentDatabase';

describe('OptiGreen Persistent Database Service', () => {
  const testDbPath = path.join(process.cwd(), 'data', 'test_store.json');

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch {}
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch {}
    }
  });

  it('initializes default schema and persists to disk', () => {
    const db = new PersistentDatabase(testDbPath);
    expect(fs.existsSync(testDbPath)).toBe(true);

    const queue = db.getQueue();
    expect(Array.isArray(queue)).toBe(true);
    expect(queue.length).toBeGreaterThan(0);

    const stats = db.getStats();
    expect(stats.isDurable).toBe(true);
    expect(stats.mode).toBe('PERSISTENT_FILE_ACID');
  });

  it('persists newly enqueued workloads across database reboots', () => {
    // 1. Process 1 enqueues an item
    const db1 = new PersistentDatabase(testDbPath);
    const newWorkload = {
      id: 'sqs-persist-test-1',
      repo: 'payments-core',
      branch: 'main',
      commitSha: '99aa88b',
      awsRegion: 'us-west-2',
      carbonIntensity: 110,
      threshold: 250,
      queueTime: '01:00 AM',
      estWait: '~ 1m',
      status: 'QUEUED' as const,
      decision: 'PROCEED' as const,
      commitAuthor: 'Architect',
      workflowId: 'wf-11111',
      createdAt: new Date().toISOString(),
      slaTier: 'P2_FEATURE' as const
    };

    db1.enqueue(newWorkload);
    expect(db1.getQueue().some((q) => q.id === 'sqs-persist-test-1')).toBe(true);

    // 2. Simulated Server Reboot (new process instance reading same disk store)
    const db2 = new PersistentDatabase(testDbPath);
    const restoredQueue = db2.getQueue();
    const item = restoredQueue.find((q) => q.id === 'sqs-persist-test-1');
    expect(item).toBeDefined();
    expect(item?.repo).toBe('payments-core');
    expect(item?.carbonIntensity).toBe(110);
  });

  it('persists item deletion and updates across restarts', () => {
    const db1 = new PersistentDatabase(testDbPath);
    const idToDelete = db1.getQueue()[0].id;
    db1.removeQueueItem(idToDelete);

    // Restart
    const db2 = new PersistentDatabase(testDbPath);
    expect(db2.getQueue().some((q) => q.id === idToDelete)).toBe(false);
  });

  it('persists threshold settings across restarts', () => {
    const db1 = new PersistentDatabase(testDbPath);
    db1.updateSettings({ threshold: 190 });

    // Restart
    const db2 = new PersistentDatabase(testDbPath);
    expect(db2.getSettings().threshold).toBe(190);
  });
});
