// Tamper-Evident ESG Audit Ledger (Pillar 6)
// Real SHA-256 hash chaining via the Web Crypto API — works in Node 18+ and browsers.
// Every block commits to its parent hash, so any tampering breaks the chain and is
// detected by verifyChain(). Unit tested in test/auditLedger.test.ts.

export interface LedgerBlock {
  blockIndex: number;
  timestamp: string;
  deploymentId: string;
  repo: string;
  decision: string;
  carbonIntensity: number;
  carbonSavedKg: number;
  costUsd: number;
  csrdScope3Category: string;
  previousHash: string;
  currentHash: string;
  auditorSignature: string;
}

export const CSRD_SCOPE3_CATEGORY = 'Scope 3 Category 1: Purchased Goods & Services (Cloud Computing & Digital Infrastructure)';
const GENESIS_HASH = '0'.repeat(64);

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export class AuditLedger {
  private blocks: LedgerBlock[] = [];
  private appendQueue: Promise<any> = Promise.resolve();

  constructor(seedBlocks: LedgerBlock[] = []) {
    this.blocks = seedBlocks.map((b) => ({ ...b }));
  }

  getChain(): LedgerBlock[] {
    return [...this.blocks];
  }

  get length(): number {
    return this.blocks.length;
  }

  private get lastHash(): string {
    const last = this.blocks[this.blocks.length - 1];
    return last ? last.currentHash : GENESIS_HASH;
  }

  // Canonical payload hashed into the block — excludes the hash fields themselves.
  private static canonicalPayload(b: Omit<LedgerBlock, 'currentHash' | 'auditorSignature'>): string {
    return JSON.stringify({
      blockIndex: b.blockIndex,
      timestamp: b.timestamp,
      deploymentId: b.deploymentId,
      repo: b.repo,
      decision: b.decision,
      carbonIntensity: b.carbonIntensity,
      carbonSavedKg: b.carbonSavedKg,
      costUsd: b.costUsd,
      csrdScope3Category: b.csrdScope3Category,
      previousHash: b.previousHash
    });
  }

  async appendBlock(input: Omit<LedgerBlock, 'blockIndex' | 'timestamp' | 'previousHash' | 'currentHash' | 'auditorSignature'>): Promise<LedgerBlock> {
    const operation = async (): Promise<LedgerBlock> => {
      const blockIndex = this.blocks.length + 1;
      const timestamp = new Date().toISOString();
      const previousHash = this.lastHash;

      const block: Omit<LedgerBlock, 'currentHash' | 'auditorSignature'> = {
        blockIndex,
        timestamp,
        ...input,
        previousHash
      };

      const currentHash = await sha256Hex(AuditLedger.canonicalPayload(block));
      const auditorSignature = `SHA256_CHAIN_VERIFIED_${currentHash.slice(0, 16).toUpperCase()}`;

      const full: LedgerBlock = { ...block, currentHash, auditorSignature };
      this.blocks.push(full);
      return full;
    };

    // Serialize concurrent appendBlock invocations into a strict sequential promise queue
    const nextPromise = this.appendQueue.then(operation);
    this.appendQueue = nextPromise.catch(() => {});
    return nextPromise;
  }

  // Recompute every block hash and confirm each one commits to its parent.
  async verifyChain(): Promise<{ valid: boolean; verifiedBlocks: number; brokenAtIndex: number | null }> {
    let expectedPrev = GENESIS_HASH;

    for (const block of this.blocks) {
      if (block.previousHash !== expectedPrev) {
        return { valid: false, verifiedBlocks: block.blockIndex - 1, brokenAtIndex: block.blockIndex };
      }
      const recomputed = await sha256Hex(AuditLedger.canonicalPayload(block));
      if (recomputed !== block.currentHash) {
        return { valid: false, verifiedBlocks: block.blockIndex - 1, brokenAtIndex: block.blockIndex };
      }
      expectedPrev = block.currentHash;
    }

    return { valid: true, verifiedBlocks: this.blocks.length, brokenAtIndex: null };
  }
}

// Global server-side ledger instance.
export const globalAuditLedger = new AuditLedger();