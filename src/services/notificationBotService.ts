/**
 * OptiGreen Developer Ergonomics: GitHub PR & Slack Notification Bot Service
 * 
 * Generates transparent, actionable PR comments and Slack cards when a build is held
 * with a 1-click self-serve developer override URL to eliminate friction.
 */

export interface WorkloadNotificationContext {
  workloadId: string;
  repo: string;
  branch: string;
  commitSha: string;
  author: string;
  originRegion: string;
  currentIntensity: number;
  threshold: number;
  holdEstimatedMinutes: number;
  carbonAvoidedKg: number;
  overrideUrl: string;
}

export function generateGitHubPrMarkdownComment(ctx: WorkloadNotificationContext): string {
  return `### 🌿 OptiGreen Carbon-Aware CI/CD Gate
> **Build Hold Notice:** Workload for commit \`${ctx.commitSha.substring(0, 7)}\` on \`${ctx.branch}\` is currently held for a cleaner grid window.

| Metric | Status |
| :--- | :--- |
| **Origin Grid** | \`${ctx.originRegion}\` (**${ctx.currentIntensity} gCO₂eq/kWh** vs threshold **${ctx.threshold}**) |
| **Est. Queue Hold** | **~${ctx.holdEstimatedMinutes} minutes** (Waiting for local renewable window) |
| **Est. Carbon Saved** | **~${ctx.carbonAvoidedKg} kg CO₂e** (GHG Scope 3 Category 1) |

---
**Need this deployed immediately?** Developers always retain velocity control:  
👉 **[Click Here to Force-Dispatch Immediately (0ms Override)](${ctx.overrideUrl})**  
*(Overrides are permanently recorded in the SHA-256 CSRD Audit Ledger)*`;
}

export function generateSlackBlockKitMessage(ctx: WorkloadNotificationContext): Record<string, any> {
  return {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🌿 OptiGreen Pipeline Gate: Build Held', emoji: true }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Repository:*\n\`${ctx.repo}\` (${ctx.branch})` },
          { type: 'mrkdwn', text: `*Author:*\n${ctx.author}` },
          { type: 'mrkdwn', text: `*Grid Intensity:*\n${ctx.currentIntensity} gCO₂/kWh (Limit: ${ctx.threshold})` },
          { type: 'mrkdwn', text: `*Est. Carbon Saved:*\n${ctx.carbonAvoidedKg} kg CO₂e` }
        ]
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '⚡ Override & Dispatch Now' },
            style: 'primary',
            url: ctx.overrideUrl,
            action_id: `override_${ctx.workloadId}`
          }
        ]
      }
    ]
  };
}
