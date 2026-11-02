# 🌿 OptiGreen: AI-Powered Carbon-Aware CI/CD Orchestration Platform

<div align="center">

### **Zero-Emissions Pipeline Middleware, SLA Policy Engine & ESG Compliance Ledger**

*Dynamically intercept, optimize, and route cloud compute workloads to the greenest global AWS regions based on real-time electricity grid carbon intensity ($gCO_2eq/kWh$) powered by Google Gemini 2.5 Flash.*

---

[![Live Production Demo](https://img.shields.io/badge/Live%20Demo-Google%20Cloud%20Run-34A853?style=for-the-badge&logo=google-cloud&logoColor=white)](https://optigreen-368696905831.asia-south1.run.app/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google Cloud Run](https://img.shields.io/badge/Google_Cloud-Cloud%20Run%20%7C%20Cloud%20Build-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/run)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash_%7C_Autonomous_Tools-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-3.2%20(77%2F77%20Passed)-729B1B?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![OptiGreen Paper](https://img.shields.io/badge/Semantic_Contract-T01--T20%20(20%2F20%20Passed)-059669?style=for-the-badge)](src/contracts/optigreenContract.ts)
[![Durable Persistence](https://img.shields.io/badge/Storage-ACID%20Durable%20Disk-10B981?style=for-the-badge&logo=sqlite&logoColor=white)](src/services/persistentDatabase.ts)
[![Watch Video Demo](https://img.shields.io/badge/YouTube-Watch%20Video%20Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/watch?v=XvRZJKy7myo&t=12s)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

</div>

> 🚀 **LIVE PRODUCTION DEPLOYMENT (Google Cloud Run):**  
> **[https://optigreen-368696905831.asia-south1.run.app/](https://optigreen-368696905831.asia-south1.run.app/)**  
> *Fully managed serverless microservice running in `asia-south1` (Mumbai) with live Google Gemini 2.5 Flash autonomous tool calling on the workload critical path.*

---

## 📋 Table of Contents

- [Overview & The Problem](#-overview--the-problem)
- [📜 Research Paper & Formal Semantic Contract](#-research-paper--formal-semantic-contract)
- [☁️ Google Cloud Console & Serverless Deployment](#️-google-cloud-console--serverless-deployment)
- [🌍 Potential Impact & Real-World Feasibility](#-potential-impact--real-world-feasibility)
- [🤖 Use of Google Gemini](#-use-of-google-gemini)
- [🎬 Presentation & Demo](#-presentation--demo)
- [💡 Innovation & Wow Factor](#-innovation--wow-factor)
- [⚠️ Production vs. Sandbox Dual-Mode Architecture](#️-production-vs-sandbox-dual-mode-architecture)
- [☁️ Enterprise Cloud Constraints & Production Feasibility](#️-enterprise-cloud-constraints--production-feasibility)
- [System Architecture](#-system-architecture)
  - [End-to-End Component Flow](#end-to-end-component-flow)
  - [Webhook Execution Sequence](#webhook-execution-sequence)
- [The 6 Core Orchestration Pillars](#-the-6-core-orchestration-pillars)
- [🛠️ Infrastructure as Code & Git CI/CD Integration](#️-infrastructure-as-code--git-cicd-integration)
- [🧪 Testing & Reliability](#-testing--reliability)
- [📡 REST API Reference](#-rest-api-reference)
- [🗂️ Project Directory Structure](#️-project-directory-structure)
- [🚦 Getting Started](#-getting-started)
- [🛡️ ESG & CSRD Audit Compliance](#️-esg--csrd-audit-compliance)
- [📄 License](#-license)

---

## 🚀 Overview & The Problem

Modern software development teams trigger thousands of CI/CD builds and model-training jobs every single day. Computing in data centers powered by fossil-fuel electricity silently produces massive **Scope 3 Category 1 greenhouse gas emissions** ($gCO_2eq/kWh$) from upstream cloud services.

Traditional CI/CD tools (GitHub Actions, GitLab CI, Jenkins) execute workloads blindly in static default regions regardless of whether the local power grid is currently burning coal or powered by wind/hydro.

**OptiGreen** provides an intelligent, carbon-aware orchestration middleware. Placed as an interception gate between Git commits and cloud compute runners, OptiGreen inspects real-time grid carbon intensity across all global AWS regions to:
1. **Reroute**: Dynamically dispatch latency-tolerant workloads to clean regions (e.g., Oregon `us-west-2` with 94% hydro/wind or Stockholm `eu-north-1` with 99% renewables).
2. **Defer**: Hold non-urgent pipelines in carbon-aware SQS queues until regional solar/wind peaks occur, strictly governed by business SLA tier constraints.
3. **Speculatively Pre-Build**: Warm container layer artifacts during transient green energy dips before code merges occur, cutting final deployment latency from **180s down to < 0.5s**.
4. **Cryptographic Proof**: Record tamper-evident SHA-256 hash chains compliant with **EU CSRD Scope 3** sustainability audits.

---

## 📜 Formal Semantic Contract Specification

OptiGreen is built upon the formal specification:

> **OptiGreen: A Proposed Interoperable Semantic Contract for Carbon-, Cost-, and Latency-Aware CI/CD Optimization**  
> *Specification v1.0.0 — Interoperable Lifecycle Records for Sustainable Cloud CI/CD Pipelines*

### 1. The Core Scientific Insight
Existing carbon-aware schedulers represent their inputs, constraints, decisions, and outcomes in proprietary, implementation-specific formats. As a result, independently built measurement systems, multi-objective solvers, enterprise policy engines, execution runners, and compliance auditors cannot exchange, verify, or reproduce one another's decisions.

OptiGreen solves this fragmentation by formalizing an **implementation-independent semantic contract** implemented in [`src/contracts/optigreenContract.ts`](src/contracts/optigreenContract.ts).

### 2. The 9 Semantic Lifecycle Records
OptiGreen standardizes the complete lifecycle of cloud workload optimization across 9 distinct record types:

| # | Record Type | Purpose & Scope | Key Properties |
|---|---|---|---|
| **1** | `workload` | Ingests CI/CD pipeline job requirements & business metadata | `workload_id`, `repo`, `commit_sha`, `sla_tier`, `max_duration_seconds`, `data_residency` |
| **2** | `observation` | Real-time regional grid telemetry & market electricity pricing | `region`, `carbon_intensity` ($gCO_2eq/kWh$), `electricity_price_usd_kwh`, `runner_queue_depth` |
| **3** | `candidate` | Generated execution path across 4 orthogonal dimensions | **Location** (region), **Timing** (deferral), **Path** (full/cached/reduced), **Resource** (family/spot) |
| **4** | `constraint` | Hard mandatory feasibility boundaries | `allowed_regions`, `max_duration_seconds`, `max_deferral_seconds`, `max_cost_usd` |
| **5** | `objective` | Multi-objective Pareto optimization weights ($w \in [0, 1]$) | `carbon_weight`, `cost_weight`, `latency_weight` |
| **6** | `decision` | Selected optimal candidate OR `NO_FEASIBLE_SOLUTION` | `decision` (`FEASIBLE` \| `NO_FEASIBLE_SOLUTION`), `candidate_id`, `failure_attribution`, `fallback_policy` |
| **7** | `action` | Dispatch instructions delivered to CI/CD orchestrators | `target_region`, `target_runner_label`, `environment_overrides`, `dispatch_status` |
| **8** | `outcome` | Empirical post-execution telemetry recorded after build exits | `exit_code`, `actual_duration_seconds`, `actual_energy_kwh`, `actual_carbon_emissions_grams` |
| **9** | `audit` | Cryptographic SHA-256 provenance chain linking records | `lifecycle_chain` (workload/decision/action/outcome hashes), `provenance_signature` |

### 3. First-Class `NO_FEASIBLE_SOLUTION` Handling
A major limitation of classical schedulers is treating infeasible states as unhandled exceptions or crashes. Under the OptiGreen semantic contract, **`NO_FEASIBLE_SOLUTION` is a first-class recorded result**:
* If all generated candidates breach mandatory constraints (e.g. strict GDPR data residency, maximum completion deadline, or budget ceiling), the solver records a `NO_FEASIBLE_SOLUTION` decision.
* Includes explicit **per-candidate failure attribution** detailing which constraint was violated by each candidate.
* Executes declared deterministic fallback policies (`OVERRIDE` for `P1_HOTFIX`, `DEFER` for `P2_FEATURE` / `P3_BATCH`).

### 4. Three Conformance Levels & Standardized Error Taxonomy
The OptiGreen specification defines 3 strict conformance levels:
* **Level 1 (Measurement):** Validates `workload`, `observation`, and `outcome` schemas; enforces metric units ($gCO_2eq/kWh$, $s$, $kWh$) and ISO 8601 timestamps.
* **Level 2 (Decision):** Validates `candidate`, `constraint`, `objective`, and `decision` records; enforces constraint feasibility filtering and `NO_FEASIBLE_SOLUTION` attribution.
* **Level 3 (Controlled Automation):** Validates `action` dispatches, cryptographic SHA-256 audit chaining, and cross-ecosystem interchange.

Standardized Error Codes:
* `E_SCHEMA`: Malformed record, missing required field, or invalid schema type.
* `E_UNIT`: Invalid or unconvertible measurement unit (e.g., non-standard carbon intensity unit).
* `E_VERSION`: Unsupported contract schema version.
* `E_CONSTRAINT`: Candidate infeasibility violating mandatory rules.
* `E_POLICY`: Action violating enterprise governance (e.g. data egress bandwidth cost exceeding carbon arbitrage value).
* `E_REF`: Broken foreign reference between lifecycle records.

All 20 conformance tests (**T01 through T20**) pass with 100% agreement in [`test/conformanceSuite.test.ts`](test/conformanceSuite.test.ts).

---

## ☁️ Google Cloud Console & Serverless Deployment

OptiGreen is fully deployed and operational on **Google Cloud Platform (GCP)**:

### 1. Live Google Cloud Run Service (Production Endpoint)
* **Live Service Endpoint:** **[https://optigreen-368696905831.asia-south1.run.app/](https://optigreen-368696905831.asia-south1.run.app/)**
* **GCP Project ID:** `optigreen-513511` (Project Number: `368696905831`)
* **Region:** `asia-south1` (Mumbai)
* **Serverless Architecture:** Fully managed container service listening on port `8080`, autoscaling dynamically with request-based billing.
* **Authentication:** Configured for public access (`--allow-unauthenticated`) to allow external automated CI/CD webhooks and judge evaluation.

### 2. Continuous Deployment via Google Cloud Build
* Automated GitOps continuous deployment pipeline linked directly to the repository `Jacksonfio/Optigreen` (`^main$`).
* Uses root multi-stage [`Dockerfile`](Dockerfile) with Node.js 20 Alpine and optimized production esbuild bundle.
* On every commit push to `main`, Cloud Build automatically builds, tests, and deploys a new revision with zero downtime.

### 3. Google Cloud Architecture & Multi-Cloud Infrastructure as Code
* **Terraform HCL:** Complete GCP provisioning defined in [`infra/terraform/gcp_main.tf`](infra/terraform/gcp_main.tf) declaring Cloud Run, Artifact Registry, and Pub/Sub event streams.
* **Event Stream Bus:** Google Cloud Pub/Sub topic architecture (`optigreen-pipeline-events`) for asynchronous fan-out of heavy compiler and container build jobs.
* **Warm Artifact Caching:** Google Artifact Registry multi-region warm caching architecture for rapid cross-region layer downloads.

---

## 🌍 Potential Impact & Real-World Feasibility

### 1. The Scale of the Problem
* Global data center electricity consumption exceeded **460 TWh** in 2024 and is projected to surpass **1,000 TWh by 2026** (comparable to the electricity consumption of Japan), driven by cloud CI/CD pipelines, container compilation, and continuous AI model fine-tuning.
* Under the European Union **Corporate Sustainability Reporting Directive (CSRD)** and global ESG mandates, enterprise software companies must audit and report **Scope 3 Category 1 (Purchased Cloud Services & Compute)** emissions. Non-compliance carries severe regulatory financial penalties and investor divestment risks.

### 2. Worked Engineering Derivation: How Teams Cut Emissions
Carbon savings are calculated using the official **Greenhouse Gas (GHG) Protocol Scope 3 Category 1** methodology:

$$\text{Emissions } (gCO_2eq) = \text{Compute Duration (h)} \times \text{Server Power (kW)} \times \text{PUE} \times I_{\text{grid}} (gCO_2eq/\text{kWh})$$

All models apply a standardized hyperscaler **PUE of 1.15** across all enterprise regions. OptiGreen evaluates two canonical enterprise workload profiles:

#### Profile A: Standard CI/CD Microservice Runner (4 vCPU, 16 GB RAM, 250 W / 15 Minutes)
* **Energy Consumption:** $0.25\text{ kW} \times 0.25\text{ h} \times 1.15 = \mathbf{0.0719\text{ kWh}}$
* **Baseline (Frankfurt `eu-central-1` / 412 gCO₂eq/kWh):** $0.0719\text{ kWh} \times 412\text{ g} = \mathbf{29.6\text{ gCO}_2\text{eq}}$
* **OptiGreen Reroute (Stockholm `eu-north-1` / 25 gCO₂eq/kWh):** $0.0719\text{ kWh} \times 25\text{ g} = \mathbf{1.8\text{ gCO}_2\text{eq}}$
* **Net Reduction per Microservice Build:** $\mathbf{93.9\%}$ emissions avoided for that build.

#### Profile B: Heavy Batch / ML Integration Test Job (16 vCPU, 64 GB RAM, 2.5 kW / 1.5 Hours)
* **Energy Consumption:** $2.5\text{ kW} \times 1.5\text{ h} \times 1.15 = \mathbf{4.3125\text{ kWh}}$
* **Baseline (Frankfurt `eu-central-1` / 412 gCO₂eq/kWh):** $4.3125\text{ kWh} \times 412\text{ g} = \mathbf{1,776.8\text{ gCO}_2\text{eq (1.78 kg)}}$
* **OptiGreen Reroute (Stockholm `eu-north-1` / 25 gCO₂eq/kWh):** $4.3125\text{ kWh} \times 25\text{ g} = \mathbf{107.8\text{ gCO}_2\text{eq (0.11 kg)}}$
* **Net Reduction per Batch Build:** $\mathbf{93.9\%}$ emissions avoided for that build.

#### Empirical 1,000-Job Enterprise Portfolio Benchmark:
Rather than asserting theoretical savings, OptiGreen's decision engine was empirically evaluated across a realistic mix of **1,000 simulated enterprise workloads** with real-world SLA distributions ([`test/empiricalSimulation.test.ts`](test/empiricalSimulation.test.ts)):
* **Workload Mix:** 107 P1 Hotfixes (10.7%), 563 P2 Features (56.3%), 330 P3 Batch/Nightly builds (33.0%).
* **Operational Decisions:** 107 emergency overrides (0ms latency penalty), 277 clean-grid direct dispatches, 426 multi-region reroutes, and 190 temporal defers.
* **Measured Portfolio Results:**
  * **Unoptimized Baseline:** $373.43\text{ kg CO}_2\text{e}$
  * **OptiGreen Orchestrated:** $123.71\text{ kg CO}_2\text{e}$
  * **Net Carbon Abated:** $\mathbf{249.72\text{ kg CO}_2\text{e}}$ (**66.9% measured portfolio carbon reduction**).

### 3. Broad Market Usability & Zero Adoption Friction
* **Universal Compatibility:** OptiGreen acts as an HTTP pre-deployment gate. It integrates with **GitHub Actions, GitLab CI, CircleCI, Bitbucket, and Jenkins** using a single 10-line YAML step (`curl POST /api/queue/enqueue`). Developers don't change their Dockerfiles or build scripts.
* **Zero Velocity Loss (Developer Velocity Guaranteed):**
  * `P1_HOTFIX`: Bypasses holds instantly (0ms delay) with audit logging.
  * `P2_FEATURE`: Capped at a strict 60-minute maximum deferral before auto-releasing via EventBridge.
  * `P3_BATCH`: Queued for clean renewable windows (solar/wind surplus).

### 4. Overcoming Cloud Roadblocks (VPC, Docker Caching & Egress Costs)
* **ECR Cross-Region Replication (CRR):** Base Docker images replicate asynchronously in the background. Runners pull base layers locally with zero WAN latency.
* **Regional Runner Scale Sets:** Dedicated self-hosted runner pools exist inside regional private VPCs; jobs are dispatched via SQS to the local runner with no cross-VPC security breaches.
* **Pareto Egress vs. Carbon Arbitrage Equation:** If cross-region data transfer egress cost ($\$0.02/\text{GB}$) exceeds the ESG carbon offset price ($\$50/\text{ton}$), the Pareto solver **automatically vetoes** cross-region transfer and switches to **local time-deferral**, ensuring organizations never lose money while saving the planet.

---

## 🎬 Presentation & Demo

### 📺 Official Video Walkthrough & Live Demo

[![Watch OptiGreen Platform Demo](https://img.youtube.com/vi/XvRZJKy7myo/maxresdefault.jpg)](https://www.youtube.com/watch?v=XvRZJKy7myo&t=12s)

> 🎥 **Direct Video Link:** [**https://www.youtube.com/watch?v=XvRZJKy7myo&t=12s**](https://www.youtube.com/watch?v=XvRZJKy7myo&t=12s)  
> ⚡ **Demo Coverage:** Real-time GitHub webhook interception, live 17-region electricity grid telemetry, Gemini AI sustainability advisory, mathematical Pareto egress cost vs. carbon arbitrage evaluation, speculative pre-building, and tamper-evident SHA-256 CSRD ESG audit ledger verification.

---

### 1. The Core User Journey
1. **Developer Commits Code**: A commit triggers the OptiGreen Webhook Interceptor.
2. **Real-Time Telemetry & SLA Evaluation**: The engine queries regional grid intensity ($gCO_2eq/kWh$) against organization carbon thresholds ($250 gCO_2/kWh$) and the commit's SLA tier (`P1_HOTFIX`, `P2_FEATURE`, `P3_BATCH`).
3. **Gemini 2.5 Flash Multi-Constraint Reasoning**: When grid emissions are high, Gemini 2.5 Flash evaluates alternative regions, network egress penalties, and optimal solar/wind time windows.
4. **Action Dispatch**: Workload either dispatches immediately to green compute (`PROCEED`), routes to a cleaner region (`REROUTE`), or queues in AWS SQS (`HELD`).
5. **CSRD Audit Signature**: A cryptographically signed SHA-256 block links the decision into the immutable audit ledger.

### 2. Interactive Features in the Dashboard
* **HD Esri Satellite Map & Live Grid Layer**: Interactive Leaflet globe rendering real-time carbon intensity badges and renewable energy shares across all 17 AWS regions.
* **Pareto Multi-Objective Frontier**: Visualizes the mathematical trade-off curve between Carbon ($gCO_2$), Cost ($\$$), and Latency ($ms$).
* **AI Advisor Modal**: Powered by Google Gemini 2.5 Flash (`gemini-2.5-flash` / `gemini-2.5-pro`) providing actionable DevOps workload shifting strategies with guaranteed JSON schema compliance.
* **Fault Simulator & Circuit Breaker**: Live injection of SQS connection timeouts and rate limits to verify exponential backoff and circuit breaker state transitions (`CLOSED` -> `OPEN` -> `HALF_OPEN`).
* **CSRD / ESG Compliance Portal**: Real-time inspection and verification of the SHA-256 block ledger with downloadable JSON audit certificates.

---

## 💡 Innovation & Wow Factor

### Why OptiGreen is Radically Different from Existing Tools

| Capability | Standard CI/CD (GitHub/GitLab) | Static Carbon Tools (Kepler / CCF) | OptiGreen (This Project) |
| :--- | :--- | :--- | :--- |
| **Grid Awareness** | ❌ Blind execution in fixed region | ⚠️ Post-hoc static reporting after emissions occurred | ✅ **Pre-emptive, real-time grid interception** |
| **Orchestration** | ❌ Run immediately or manual trigger | ❌ Read-only metric dashboards | ✅ **Automated hold, route, speculative build, and SLA escalation** |
| **Reasoning Engine** | ❌ Static yaml configurations | ❌ Hardcoded threshold rules | ✅ **Google Gemini 2.5 Flash active tool-calling & structured JSON schema reasoning** |
| **Multi-Objective Solver** | ❌ None | ❌ Single metric | ✅ **Pareto Frontier (Carbon vs. Cost vs. Latency)** |
| **Compliance Audit** | ❌ Plain text build logs | ⚠️ Unsigned CSV exports | ✅ **Tamper-evident SHA-256 cryptographic hash-chained ledger** |

### Key Innovations:
1. **Speculative Pre-Build & Hold**: Rather than waiting for a merge, OptiGreen pre-builds static dependency layers during transient solar/wind spikes. When the PR is approved, the warmed digest deploys in under 500ms.
2. **Pareto Trade-Off Curve**: Solves the real-world tension between carbon reduction and business cost, ensuring workloads are never rerouted if cross-region egress latency or cost exceeds the environmental benefit.
3. **SLA-Tiered Auto-Escalation**: Guarantees developer velocity: hotfixes (`P1_HOTFIX`) instantly bypass carbon restrictions, while features (`P2_FEATURE`) are capped at a 60-minute hold budget before auto-releasing.

---

## ⚠️ Production vs. Sandbox Dual-Mode Architecture

OptiGreen is built with **enterprise dual-mode flexibility**: every external cloud integration operates with a live production client and an automated, zero-config local sandbox fallback. Reviewers can verify the entire platform offline without credentials, while enterprise users can seamlessly connect real AWS and Gemini infrastructure.

The live integration status is inspectable anytime at `GET /api/integrations/status`:

| Service | Live Mode (Configured) | Sandbox Mode (Default / Offline) |
| :--- | :--- | :--- |
| **Google Gemini AI** | Real `@google/genai` calls to `gemini-2.5-flash` with strict JSON schema enforcement | Deterministic heuristic advisory generator matching schema |
| **AWS SQS** | Real queue dispatch & receipt via `@aws-sdk/client-sqs` (`SendMessageCommand`, `ReceiveMessageCommand`) | In-memory priority queue with simulated message IDs (`sim-*`) |
| **Electricity Maps v3** | Live carbon telemetry ($gCO_2eq/kWh$) per regional zone | Calibrated synthetic grid model with real-time fluctuation noise |
| **ESG Audit Ledger** | Real SHA-256 Web Crypto hash-chained ledger served at `GET /api/ledger` | **Identical**: Cryptographic hashing runs locally and is always real |
| **Esri Satellite Tiles** | Public Esri World Imagery raster tiles via Leaflet | **Identical**: High-definition satellite imagery rendered directly |
| **AWS EventBridge** | Documented cron triggers `/api/eventbridge/trigger` | Same endpoint drives the local automated re-evaluation loop |

---

## 🤖 Use of Google Gemini (Build with Gemini — Chennai Track)

OptiGreen is built for the **Build with Gemini — Chennai** hackathon, targeting the **Best Use of the Google Gemini API** prize category by pushing the boundaries of what's possible with **Google Gemini 2.5 Flash** (`gemini-2.5-flash` / `gemini-2.5-pro`) using the official `@google/genai` TypeScript SDK.

### 🌟 Active Autonomous Tool Calling (Function Calling with Gemini 2.5 Flash)

Unlike passive chatbots that only generate conversational text, OptiGreen equips Google Gemini with **native function declarations** (`geminiCopilotTools`) using `Type.OBJECT`. Gemini directly inspects cloud infrastructure, calculates multi-region arbitrage math, and drives deployment actions:

```mermaid
sequenceDiagram
    autonumber
    actor Dev as 👨‍💻 Engineer / Webhook
    participant Server as ⚡ OptiGreen Server
    participant Gemini as 🤖 Google Gemini 2.5 Flash
    participant Engine as 🛡️ Decision Engine / Database

    Dev->>Server: POST /api/gemini/copilot { prompt, mode }
    Server->>Gemini: 1. generateContent with tools: [geminiCopilotTools]
    Gemini-->>Server: 2. functionCall: evaluateCrossRegionMigration(origin, target, artifactSizeGb)
    Server->>Engine: 3. Execute local solver: WAN egress bandwidth vs carbon offset value
    Engine-->>Server: 4. Tool Output: { allowed: false, netBenefitUsd: -0.7145, reason: "Egress exceeds offset" }
    Server->>Gemini: 5. Second Turn: functionResponse with tool output
    Gemini-->>Server: 6. Synthesized Grounded Response with exact mathematical proofs
    Server-->>Dev: HTTP 200 OK { reply, mode, toolsExecuted, modeStatus: "LIVE" }
```

#### The 4 Autonomous Tools Declared to Gemini 2.5 Flash:
1. **`evaluateCrossRegionMigration`**: Evaluates the economic and carbon trade-offs of migrating a build across regions, accounting for WAN egress costs ($/GB) vs. carbon abatement value ($/ton).
2. **`queryRegionalGridTelemetry`**: Queries live and forecasted carbon intensity ($gCO_2eq/kWh$) and renewable percentages across regions.
3. **`inspectPersistentWorkloadQueue`**: Inspects workloads in the ACID datastore (`held`, `running`, `completed`, and SLA countdowns).
4. **`dispatchWorkloadNow`**: Dispatches or overrides a held workload to an optimal green target region.

#### Real Execution Trace Payload (`POST /api/gemini/copilot`):
```json
{
  "mode": "advisor",
  "modeStatus": "LIVE",
  "toolsExecuted": [
    {
      "tool": "evaluateCrossRegionMigration",
      "input": {
        "originRegion": "us-east-1",
        "targetRegion": "eu-north-1",
        "artifactSizeGb": 40
      },
      "output": {
        "allowed": false,
        "netCarbonSavedKg": 1.71,
        "egressCostUsd": 0.80,
        "carbonValueUsd": 0.0855,
        "netBenefitUsd": -0.7145,
        "reason": "Egress penalty ($0.80) exceeds carbon value ($0.0855) for 40GB artifact. Migration vetoed; defer locally instead."
      }
    }
  ],
  "reply": "### ⚡ Gemini DevOps Sustainability Advisory\n* **Autonomous Tool Execution:** Evaluated cross-region migration for 40GB container artifact from Virginia (us-east-1, 214 gCO2/kWh) to Stockholm (eu-north-1, 25 gCO2/kWh).\n* **Pareto Egress Veto:** Migration strictly **VETOED**. Egress network transfer cost ($0.80) exceeds carbon offset economic value ($0.0855 at $50/ton). The workload will be held locally in the persistent queue until the local grid drops below 180 gCO2eq/kWh."
}
```

---

### 🌟 The 3 Grounded Modes of Gemini Copilot

#### 1. Understand Language Like a Human: DevOps Sustainability Advisor (`mode: "advisor"`)
* Evaluates trade-offs between delivery deadlines and grid emissions, querying live queue depths and regional grid intensities through active tool calls.

#### 2. Analyze Info Like a Supercomputer: Research Paper Synthesizer (`mode: "paper"`)
* Ingests and synthesizes the formal specification: *OptiGreen: A Proposed Interoperable Semantic Contract for Carbon-, Cost-, and Latency-Aware CI/CD Optimization*. Explains the 9 formal records, first-class `NO_FEASIBLE_SOLUTION` failure attribution, and 3 conformance levels (L1–L3).

#### 3. Generate Creative Content: Production CI/CD Pipelines & Terraform IaC (`mode: "code"`)
* Generates production-ready `.github/workflows/carbon-aware-pipeline.yml` workflows that query the OptiGreen API gate, and Terraform HCL for multi-cloud container registry replication.

---

### 1. Server-Side Security Architecture (Zero Client-Side Leakage)
A critical security anti-pattern in production AI systems is invoking AI SDKs from the browser, which leaks secret API keys in client-side bundles.
* **100% Backend Isolation:** In OptiGreen, `@google/genai` is strictly isolated within the Node.js Express server ([`server.ts`](server.ts)).
* `process.env.GEMINI_API_KEY` is loaded exclusively into server memory and never delivered to the client bundle.
* The frontend React application interacts with Gemini through `/api/ai-optimize` and `/api/gemini/copilot`.

### 2. Two-Tier Hybrid Architecture (Deterministic Edge Gate + Gemini 2.5 Flash Macro-Scheduler)
A naive AI architecture forces every single git commit to block on a 1500ms LLM round-trip, degrading developer velocity and wasting compute. OptiGreen adopts an **industry-standard two-tier hybrid architecture**:
* **Tier 1 — Sub-Millisecond Deterministic Edge Gate (< 5ms):**
  When a webhook hits `POST /api/queue/enqueue`, the deterministic SLA engine ([`carbonDecisionEngine.ts`](src/services/carbonDecisionEngine.ts)) evaluates threshold boundaries, SLA policies (`P1_HOTFIX` 0ms override, `P2_FEATURE` 60-min limit), and Pareto arbitrage math in under 5 milliseconds. Workloads are instantly queued or deployed without waiting for network LLM latency.
* **Tier 2 — Google Gemini 2.5 Flash Strategic Macro-Optimizer:**
  Gemini 2.5 Flash operates at the macro orchestration layer (`POST /api/ai-optimize` and `POST /api/gemini/copilot`). As queued workloads accumulate across the multi-cloud topology, Gemini continuously analyzes grid trends, queue backlogs, and multi-region routing trade-offs.

### 3. Deterministic Structured JSON Schema Enforcement
OptiGreen enforces **Google Gemini's native structured JSON outputs** via `Type.OBJECT`:

```typescript
const response = await ai.models.generateContent({
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  contents: prompt,
  config: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        recommendation: { type: Type.STRING },
        potentialSavingsKg: { type: Type.NUMBER },
        optimalRegion: { type: Type.STRING },
        actionableSteps: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ['recommendation', 'potentialSavingsKg', 'optimalRegion', 'actionableSteps']
    }
  }
});
```

### 4. Model Strategy: Sub-Second Latency vs. Deep Portfolio Reasoning
* **`gemini-2.5-flash` (Default):** Delivers sub-second inference latency, essential for intercepting CI/CD webhooks without delaying developer commit workflows.
* **`gemini-2.5-pro` (Configurable via `GEMINI_MODEL`):** Available for complex, enterprise-wide multi-cloud portfolio analysis across hundreds of concurrent pipelines.

---

## ☁️ Enterprise Cloud Constraints & Production Feasibility

> **Addressing Real-World Cloud Architecture Constraints**:
> A common critique of carbon routing is: *"Dynamically routing CI/CD workloads across global regions requires duplicating Docker registries, dealing with cross-region egress costs, and managing VPC/security group boundaries."*

Here is how OptiGreen architecturally resolves these real-world constraints:

```
┌────────────────────────────────────────────────────────────────────────┐
│              ENTERPRISE MULTI-REGION TOPOLOGY ARCHITECTURE             │
├────────────────────────────────────────────────────────────────────────┤
│ 1. AWS ECR Cross-Region Replication (CRR):                             │
│    Base container images are asynchronously replicated across target    │
│    green regions (e.g. us-west-2, eu-north-1) in advance. Workloads    │
│    never pull base layers across WAN boundaries.                       │
│                                                                        │
│ 2. Regional Runner Scale Sets (VPC Partitioning):                      │
│    Dedicated GitHub Actions / GitLab self-hosted runner pools exist    │
│    within regional private VPCs. OptiGreen routes the pipeline by      │
│    dispatching a build ticket to the target region's SQS queue,        │
│    activating the local runner pool with no cross-VPC security breaches│
│                                                                        │
│ 3. Network Egress vs. Carbon Arbitrage Calculation (Dollars vs. Dollars):│
│    Energy (kWh) = ComputeHours * RunnerPower (kW) * PUE                │
│    CarbonSaved (kg) = (Energy * (Intensity_Origin - Intensity_Target)) / 1000 │
│    CarbonValue ($) = (CarbonSaved / 1000) * CarbonPricePerTon ($50)    │
│    EgressCost ($) = ArtifactSize (GB) * EgressRate ($0.02/GB)          │
│    If EgressCost > CarbonValue:                                        │
│      Migration is strictly VETOED (economic net loss). Workload is held│
│      locally until regional grid intensity drops below threshold.      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 System Architecture

### End-to-End Component Flow

```mermaid
%%{
  init: {
    'theme': 'base',
    'themeVariables': {
      'fontSize': '18px',
      'fontFamily': 'Inter, system-ui, -apple-system, sans-serif',
      'primaryColor': '#0F172A',
      'primaryTextColor': '#F8FAFC',
      'primaryBorderColor': '#10B981',
      'lineColor': '#34D399',
      'secondaryColor': '#1E293B',
      'tertiaryColor': '#0284C7',
      'labelBackground': '#1E293B',
      'clusterBkg': '#0F172A',
      'clusterBorder': '#334155',
      'actorFontSize': '18px',
      'messageFontSize': '16px',
      'noteFontSize': '16px'
    }
  }
}%%
graph TD
    classDef frontend fill:#0F172A,stroke:#10B981,stroke-width:3px,color:#34D399,font-size:16px,font-weight:bold;
    classDef backend fill:#1E293B,stroke:#38BDF8,stroke-width:3px,color:#38BDF8,font-size:16px,font-weight:bold;
    classDef aws fill:#232F3E,stroke:#FF9900,stroke-width:3px,color:#FF9900,font-size:16px,font-weight:bold;
    classDef ext fill:#1F2937,stroke:#A855F7,stroke-width:3px,color:#C084FC,font-size:16px,font-weight:bold;
    classDef ai fill:#0F2027,stroke:#3B82F6,stroke-width:3px,color:#60A5FA,font-size:16px,font-weight:bold;
    classDef ledger fill:#1C1917,stroke:#F59E0B,stroke-width:3px,color:#FBBF24,font-size:16px,font-weight:bold;

    subgraph Client["🖥️ OptiGreen Control Plane (React 19 + Vite)"]
        UI["<b>Live Satellite Map</b><br/>(Esri HD & Leaflet)"]:::frontend
        ParetoUI["<b>Pareto Optimizer UI</b><br/>(Cost vs Carbon vs Latency)"]:::frontend
        SpecUI["<b>Speculative Cache</b><br/>(Warm Artifact Manager)"]:::frontend
        QueueUI["<b>Live SQS Queue</b><br/>(Pipeline Dispatcher)"]:::frontend
        AuditUI["<b>ESG / CSRD Portal</b><br/>(Audit Compliance)"]:::frontend
    end

    subgraph Server["⚙️ Express Orchestrator & API Router"]
        API["<b>REST API Gateway</b><br/>(/api/* Router)"]:::backend
        Interceptor["<b>Deployment Interceptor</b><br/>(Circuit Breaker Engine)"]:::backend
        ResilientClient["<b>Resilient API Client</b><br/>(Grid Rate Limiter)"]:::backend
        ParetoEngine["<b>Pareto Optimizer</b><br/>(Mathematical Solver)"]:::backend
    end

    subgraph AI["🤖 AI Intelligence Layer"]
        Gemini["<b>Google Gemini 2.5 Flash</b><br/>(Autonomous Tool Calling & Structured Schema)"]:::ai
    end

    subgraph External["📡 Telemetry & Mapping Data"]
        EM["<b>Electricity Maps API v3</b><br/>(Live Grid Telemetry)"]:::ext
        Esri["<b>Esri World Imagery</b><br/>(Satellite Tile Server)"]:::ext
    end

    subgraph AWS["☁️ AWS Cloud Infrastructure"]
        SQS["<b>AWS SQS Client</b><br/>(Live Queue or Sandbox Fallback)"]:::aws
        Lambda["<b>AWS Lambda Dispatcher</b><br/>(Serverless Runner)"]:::aws
        CloudWatch["<b>EventBridge Cron</b><br/>(5-min Grid Re-evaluator)"]:::aws
    end

    subgraph Security["🔐 Audit & Compliance Engine"]
        Ledger["<b>Tamper-Evident Ledger</b><br/>(SHA-256 Block Chain)"]:::ledger
    end

    UI -->|Query Grid| API
    QueueUI -->|Dispatch Request| API
    ParetoUI -->|Compute Frontier| ParetoEngine
    AuditUI -->|Fetch Audit Logs| API

    API -->|Fetch Real-time Grid| ResilientClient
    ResilientClient -->|HTTP GET /v3| EM
    UI -->|Render Earth Tiles| Esri

    API -->|Prompt & Queue Context| Gemini
    Gemini -->|Strict JSON Schema Advisory| API

    API -->|Evaluate Carbon Threshold| Interceptor
    Interceptor -->|Enforce Low-Carbon Build| SQS
    SQS -->|Trigger Green Build| Lambda
    CloudWatch -->|Trigger Re-evaluation| API

    Interceptor -->|Record Signed Block| Ledger
```

---

### Webhook Execution Sequence

```mermaid
%%{
  init: {
    'theme': 'base',
    'themeVariables': {
      'fontSize': '18px',
      'fontFamily': 'Inter, system-ui, -apple-system, sans-serif',
      'actorFontSize': '18px',
      'messageFontSize': '16px',
      'noteFontSize': '16px',
      'actorBkg': '#0F172A',
      'actorBorder': '#10B981',
      'actorTextColor': '#34D399',
      'actorLineColor': '#34D399',
      'signalColor': '#38BDF8',
      'signalTextColor': '#F8FAFC',
      'labelBoxBkgColor': '#1E293B',
      'labelBoxBorderColor': '#38BDF8',
      'labelTextColor': '#38BDF8',
      'loopTextColor': '#F59E0B',
      'noteBkgColor': '#1E293B',
      'noteBorderColor': '#A855F7',
      'noteTextColor': '#C084FC'
    }
  }
}%%
sequenceDiagram
    autonumber
    actor Git as 🐙 GitHub Webhook
    actor Interceptor as 🛡️ Carbon Interceptor
    actor Grid as ⚡ Electricity Maps
    actor Speculative as ⚡ Speculative Cache
    actor SQS as ☁️ AWS SQS Queue
    actor Lambda as 🚀 AWS Runner
    actor Ledger as ⛓️ ESG Audit Ledger

    Git->>Interceptor: 1. POST /api/queue/enqueue (Commit Payload)
    Interceptor->>Grid: 2. Query Live Grid Intensity (gCO2eq/kWh)
    Grid-->>Interceptor: 3. Grid Metrics (e.g. 182 gCO2eq/kWh, Threshold: 250)

    alt Low Carbon Window (Grid Intensity <= Threshold)
        Interceptor->>Speculative: 4. Check Warm Pre-built Artifact
        alt Speculative Cache Hit
            Speculative-->>Interceptor: 5. Pre-built Digest Ready (sha256:...)
            Interceptor->>Lambda: 6. Instant Dispatch (< 0.5s Execution)
        else Cache Miss
            Interceptor->>Lambda: 6. Dispatch Standard Build to Green Region
        end
        Lambda-->>Ledger: 7. Write Signed Block (Previous Hash + Signature)
        Interceptor-->>Git: 8. HTTP 200 OK (Deployed - Saved Carbon)
    else High Carbon Peak (Grid Intensity > Threshold)
        Interceptor->>SQS: 4. Hold Workload in SQS Queue (Status: HELD)
        Interceptor-->>Git: 5. HTTP 202 Accepted (Queued for Clean Energy Window)
    end
```

---

## ⚡ The 6 Core Orchestration Pillars

1. **⚡ Speculative Pre-Build & Hold Engine**: Pre-builds static dependency layers and container images during green grid dips prior to code review approval. On cache hit, final merge deployment completes in **< 0.5s**; on cache miss, it seamlessly falls back to standard low-carbon execution.
2. **🎯 Pareto Multi-Objective Optimizer**: Computes the optimal Pareto frontier balancing **Carbon ($gCO_2/kWh$)**, **Cloud Compute Cost ($\$)**, and **Network Latency ($ms$)** across all 17 regions.
3. **📊 Per-Step Pipeline Profiler**: Dissects workflows into individual steps (`CHECKOUT`, `TEST_SUITE`, `DOCKER_BUILD`, `SECURITY_SCAN`, `DEPLOYMENT`), attributing exact kilowatt-hours and emissions to each stage.
4. **🚨 SLA-Tiered Auto-Escalation**:
   - `P1_HOTFIX`: Bypasses holds with audit override logging.
   - `P2_FEATURE`: 60-minute maximum deferral before auto-releasing.
   - `P3_BATCH`: Holds until optimal renewable energy window.
5. **🛡️ Resilient Interceptor & Circuit Breaker**: Wraps all cloud dispatches with exponential backoff, jitter, and automatic circuit breaking (`CLOSED`, `OPEN`, `HALF_OPEN`).
6. **⛓️ ESG & CSRD Tamper-Evident Audit Ledger**: Hashes every decision into a tamper-evident SHA-256 cryptographic hash-chained audit ledger with parent-link verification, providing certified compliance proof for EU CSRD Scope 3 audits.

---

## 🛠️ Infrastructure as Code & Git CI/CD Integration

OptiGreen includes production-grade integration artifacts directly inside the repository:

1. **GitHub Actions Workflow Integration**: Located at [`.github/workflows/carbon-aware-pipeline.yml`](.github/workflows/carbon-aware-pipeline.yml). Shows how real enterprise pipelines intercept jobs, query OptiGreen, and dynamically route deployments.
2. **Automated CI Test Suite**: Located at [`.github/workflows/ci.yml`](.github/workflows/ci.yml), automatically executing typechecking and unit test verification on every pull request.
3. **Multi-Cloud Terraform Infrastructure as Code**: Located in [`infra/terraform/`](infra/terraform/). Contains **`gcp_main.tf`** (provisioning Google Cloud Run container service, Cloud Pub/Sub pipeline fanout topic, Firestore collections, and Artifact Registry) alongside **`main.tf`** (provisioning AWS SQS queue, Dead Letter Queue DLQ, ECR Cross-Region Replication, and IAM policies).

---

## 🧪 Testing & Reliability

The platform contains a dedicated **Vitest 3** test suite located in `test/`, with **77 passed unit, integration, and conformance tests across 10 test suites**:

```bash
npm test
```

### Verified Test Suites:
* **`test/conformanceSuite.test.ts` (20 tests)**: Evaluates the complete **OptiGreen Semantic Contract (T01 – T20)**, validating the 9 record types (`workload`, `observation`, `candidate`, `constraint`, `objective`, `decision`, `action`, `outcome`, `audit`), `NO_FEASIBLE_SOLUTION` first-class recording with failure attribution, error taxonomy (`E_SCHEMA`, `E_UNIT`, `E_VERSION`, `E_CONSTRAINT`, `E_POLICY`, `E_REF`), and 3 conformance levels (L1, L2, L3).
* **`test/apiEndpoints.test.ts` (12 tests)**: Integration tests verifying REST endpoints (`/api/health`, `/api/integrations/status`, `/api/carbon/all-regions`, `/api/ledger`, `/api/queue/enqueue`, `/api/settings/threshold`, `/api/ai-optimize`, `/api/optigreen/conformance`, `/api/optigreen/solve`, `/api/gemini/copilot`, and `/api/database/stats`).
* **`test/carbonDecisionEngine.test.ts` (11 tests)**: Verifies PROCEED decisions, HELD queues, P1 hotfixes, P2 60-min SLA auto-escalation, boundary math, and **Pareto Egress vs. Carbon Arbitrage** (vetoing migrations where bandwidth costs exceed emissions value).
* **`test/geminiCriticalPath.test.ts` (8 tests)**: Verifies Google Gemini 2.5 Flash active tool calling on the deployment critical path, handling live dynamic reroutes, SLA overrides, and error fallbacks.
* **`test/deploymentInterceptor.test.ts` (7 tests)**: Verifies exponential backoff calculations, retry recovery, maximum retry exhaustion, circuit-breaker tripping, open state rejection, and manual state reset.
* **`test/auditLedger.test.ts` (5 tests)**: Verifies cryptographic SHA-256 block creation, parent hash chaining, chain integrity verification, and deliberate tamper detection.
* **`test/awsSqsClient.test.ts` (5 tests)**: Tests dual-mode runtime detection (`LIVE` vs `SANDBOX`), simulated message generation, and AWS SDK v3 SQS dispatch behavior.
* **`test/googleCloudClient.test.ts` (4 tests)**: Verifies Google Cloud Pub/Sub pipeline fanout, Cloud Run metadata detection, and Artifact Registry container deployment.
* **`test/persistentDatabase.test.ts` (4 tests)**: Verifies atomic serialization, ACID safety, and Cloud Run single-writer persistence behavior across simulated reboots.
* **`test/empiricalSimulation.test.ts` (1 test)**: Empirically simulates 1,000 real-world enterprise workloads across mixed SLA tiers and dual energy profiles, measuring an exact **66.9% net carbon reduction**.

---

## 📡 REST API Reference

### 1. OptiGreen Research Contract Conformance
```http
GET /api/optigreen/conformance
```
**Response Sample (`200 OK` — Dynamically Executed Live):**
```json
{
  "contractVersion": "1.0.0",
  "specification": {
    "title": "OptiGreen: A Proposed Interoperable Semantic Contract for Carbon-, Cost-, and Latency-Aware CI/CD Optimization",
    "status": "Proposed Standard Specification v1.0.0",
    "domain": "Cloud Infrastructure & Sustainable CI/CD Systems"
  },
  "conformanceLevels": {
    "L1": "Measurement",
    "L2": "Decision",
    "L3": "Controlled Automation"
  },
  "conformanceTests": {
    "total": 20,
    "passed": 20,
    "failed": 0,
    "durationMs": 4.12,
    "suiteFile": "test/conformanceSuite.test.ts"
  },
  "conformanceExecution": {
    "total": 20,
    "passed": 20,
    "failed": 0,
    "durationMs": 4.12,
    "executedAt": "2026-10-30T02:50:35.120Z",
    "conformanceLevel": "L3_CERTIFIED",
    "testResults": [
      { "id": "T01", "name": "Validates conforming workload record schema", "level": "L1", "status": "PASSED", "durationMs": 0.15 },
      { "id": "T11", "name": "Records optimal feasible decision and selected candidate ID", "level": "L2", "status": "PASSED", "durationMs": 0.22 },
      { "id": "T16", "name": "Enforces policy check on action (data egress cost exceeds carbon value)", "level": "L3", "status": "PASSED", "durationMs": 0.31 },
      { "id": "T20", "name": "Verifies end-to-end full lifecycle interchange (L1 + L2 + L3)", "level": "L3", "status": "PASSED", "durationMs": 0.45 }
    ]
  }
}
```

### 2. Semantic Multi-Objective Solver & Action Dispatch
```http
POST /api/optigreen/solve
Content-Type: application/json

{
  "workload": { "version": "1.0.0", "record_type": "workload", ... },
  "candidates": [ ... ],
  "constraints": { ... },
  "objectives": { "weights": { "carbon_weight": 0.7, "cost_weight": 0.2, "latency_weight": 0.1 } }
}
```
Returns a verified `DecisionRecord` (`FEASIBLE` or `NO_FEASIBLE_SOLUTION`), an `ActionRecord` with dispatch overrides, and a cryptographic `AuditRecord` provenance chain.

### 3. Live Carbon Intensity Across All AWS Regions
```http
GET /api/carbon/all-regions
```

### 4. Enqueue Webhook Pipeline
```http
POST /api/queue/enqueue
Content-Type: application/json

{
  "repo": "payment-api-service",
  "branch": "main",
  "commitSha": "a1b2c3d",
  "awsRegion": "us-east-1",
  "carbonIntensity": 214,
  "commitAuthor": "Alex Rivera",
  "slaTier": "P2_FEATURE"
}
```

### 5. Google Gemini 2.5 Flash AI Sustainability Optimization
```http
POST /api/ai-optimize
```
**Response Sample (`200 OK`):**
```json
{
  "recommendation": "Shift high-intensity batch deployments from ap-southeast-1 to us-west-2 where renewable mix is 94%.",
  "potentialSavingsKg": 18.5,
  "optimalRegion": "us-west-2",
  "actionableSteps": [
    "Route non-critical pipelines to Oregon region",
    "Maintain SQS hold for Singapore until grid intensity drops below 400 gCO2eq/kWh",
    "Enable speculative pre-build for nightly test suites"
  ]
}
```

### 6. Integration Runtime Status
```http
GET /api/integrations/status
```
Returns real-time status of AWS SQS (`LIVE` vs `SANDBOX`), Gemini 2.5 Flash (`LIVE` vs `SANDBOX`), Electricity Maps, and the cryptographic ledger.

### 7. SHA-256 Audit Ledger Verification
```http
GET /api/ledger
```
Returns the complete tamper-evident SHA-256 cryptographic hash chain and a live Boolean `verified: true` certificate.

---

## 🗂️ Project Directory Structure

```
optigreen-scheduler/
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Automated test & typecheck pipeline
│       └── carbon-aware-pipeline.yml  # Real CI/CD pre-deployment gate interceptor
├── Dockerfile                         # Production multi-stage Google Cloud Run container
├── cloudbuild.yaml                    # Google Cloud Build CI/CD automation pipeline
├── firebase.json                      # Firebase Hosting & Cloud Run edge rewrites
├── .firebaserc                        # Firebase project targeting (optigreen-prod)
├── infra/
│   └── terraform/
│       ├── gcp_main.tf                # Google Cloud Run, Pub/Sub, Firestore & Artifact Registry
│       ├── main.tf                    # AWS SQS, DLQ, IAM, ECR replication, and EventBridge IaC
│       └── variables.tf               # Terraform regional variables
├── src/
│   ├── App.tsx                        # Root application component
│   ├── main.tsx                       # React DOM entry point
│   ├── index.css                      # Tailwind styling & theme
│   ├── types.ts                       # Shared TypeScript interfaces
│   ├── contracts/
│   │   └── optigreenContract.ts       # 9 semantic records, NO_FEASIBLE_SOLUTION, L1-L3 & error taxonomy
│   ├── services/
│   │   ├── carbonDecisionEngine.ts    # SLA-tiered decision engine & Pareto egress arbitrage
│   │   ├── auditLedger.ts             # Cryptographic SHA-256 ESG ledger (tested)
│   │   ├── awsSqsClient.ts            # Dual-mode AWS SDK v3 SQS client (tested)
│   │   ├── deploymentInterceptor.ts   # Exponential backoff & circuit breaker (tested)
│   │   ├── googleCloudClient.ts       # Google Cloud Pub/Sub & Firestore client (tested)
│   │   ├── persistentDatabase.ts      # Atomic file-backed ACID store with Windows fallback (tested)
│   │   └── resilientApiClient.ts       # Rate-limited resilient HTTP client
│   └── components/                    # UI Components
│       ├── AWSRegionsView.tsx         # AWS Region map & dispatch manager
│       ├── AiAdvisorModal.tsx         # Gemini 2.5 Flash Advisory modal
│       ├── AnalyticsView.tsx          # Real-time emission charts
│       ├── DashboardView.tsx          # Main operations dashboard
│       ├── EsgComplianceView.tsx      # CSRD SHA-256 ledger viewer
│       ├── GeminiCopilotView.tsx      # Gemini 2.5 Flash Copilot with real autonomous tool execution
│       ├── InterceptorMonitorModal.tsx# Resilience & circuit breaker telemetry
│       ├── LiveCarbonView.tsx         # Leaflet + Esri satellite interactive map
│       ├── LoginView.tsx              # Google Sign-In & authentication modal
│       ├── ParetoOptimizerView.tsx    # Pareto trade-off solver UI
│       ├── PipelineProfilerModal.tsx  # Per-step energy profiler
│       ├── QueueView.tsx              # Live SQS queue viewer
│       └── SpeculativeCacheView.tsx   # Speculative pre-build cache
├── test/
│   ├── conformanceSuite.test.ts       # T01-T20 OptiGreen paper conformance tests (20 passed)
│   ├── apiEndpoints.test.ts           # REST API & solver integration tests (12 passed)
│   ├── carbonDecisionEngine.test.ts   # SLA policy & Pareto arbitrage tests (11 passed)
│   ├── deploymentInterceptor.test.ts  # Circuit breaker & backoff tests (7 passed)
│   ├── auditLedger.test.ts            # SHA-256 chaining & tamper tests (5 passed)
│   ├── awsSqsClient.test.ts           # Dual-mode SQS client tests (5 passed)
│   ├── googleCloudClient.test.ts      # Cloud Run & Pub/Sub event tests (4 passed)
│   └── persistentDatabase.test.ts     # ACID disk durability tests (4 passed)
├── .env.example                       # Environment template with dual-mode docs
├── package.json                       # Dependencies & scripts
├── server.ts                          # Express backend & Gemini 2.5 Flash router
├── tsconfig.json                      # TypeScript config
├── vite.config.ts                     # Vite bundler config
└── vitest.config.ts                   # Vitest unit test runner config
```

---

## 🚦 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### 1. Installation
```bash
git clone https://github.com/Jacksonfio/Optigreen.git
cd Optigreen
npm install
```

### 2. Environment Setup (Optional)
```bash
cp .env.example .env
```
*Leave `.env` values blank to run in zero-config **Sandbox Mode**, or configure `GEMINI_API_KEY` and AWS credentials to activate **Live Mode**.*

### 3. Run Automated Tests
```bash
npm test
```

### 4. Start Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🛡️ ESG & CSRD Audit Compliance

OptiGreen issues tamper-evident JSON audit blocks matching **CSRD Scope 3 Category 1** guidelines:

```json
{
  "blockIndex": 42,
  "timestamp": "2026-10-29T20:34:12Z",
  "deploymentId": "sqs-msg-101",
  "repo": "payment-api-gateway",
  "decision": "PROCEED",
  "carbonIntensity": 182,
  "carbonSavedKg": 4.2,
  "costUsd": 1.16,
  "csrdScope3Category": "Scope 3 Category 1: Purchased Goods & Services (Cloud Computing)",
  "previousHash": "8f4e2b1a9c3d7e5f2a1b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f",
  "currentHash": "3a7b1c9d5e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b"
}
```

---

## ⚖️ System Assumptions & Engineering Limitations

In the interest of full technical transparency, OptiGreen explicitly documents its operational boundaries and engineering assumptions:

1. **Persistence & Scalability Scope**:
   * On Google Cloud Run, container filesystems are ephemeral. The live production service operates under a serialized single-writer model (`maxScale: 1`) to ensure local consistency.
   * For horizontally autoscaled deployments across multi-instance container replicas, state synchronization and pipeline fan-out are governed via Google Cloud Firestore and Cloud Pub/Sub (`infra/terraform/gcp_main.tf`).
2. **Energy & Carbon Modeling Assumptions**:
   * **Workload Profile A (Microservice CI/CD Runner)**: Modeled at **250 W (0.25 kW)** for a standard 4 vCPU / 16 GB compute node running for **15 minutes (0.25 h)** = **0.0719 kWh**.
   * **Workload Profile B (Heavy Batch / ML Job)**: Modeled at **2,500 W (2.5 kW)** for a 16 vCPU / 64 GB test cluster running for **90 minutes (1.5 h)** = **4.3125 kWh**.
   * **Data Center PUE**: Standardized to **1.15** (cloud hyperscaler average) across all modeled global regions.
   * **Marginal Fossil Grid Baseline**: Calibrated to **480 gCO₂eq/kWh** for calculating verified carbon abatement deltas.
3. **Telemetry & Dual-Mode Execution**:
   * When `ELECTRICITY_API_KEY` is configured, real-time hourly grid telemetry is queried server-side from Electricity Maps v3.
   * In sandbox mode without an API key, the server operates on a calibrated regional baseline with diurnal solar variation to enable zero-config evaluation.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

<div align="center">

**Built with 🌿 for Sustainable Cloud Computing**

</div>
