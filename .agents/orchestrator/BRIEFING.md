# BRIEFING — 2026-06-15T01:15:00+07:00

## Mission
Revamp the superapp-business-bot Telegram bot to support conversational onboarding, Supabase email OTP auth, trial vs company member access, dynamic app walkthrough, and AI intent routing using Deepseek and Nvidia.

## 🔒 My Identity
- Archetype: Project Orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: c:\Vibecoding\superapp-monorepo\.agents\orchestrator
- Original parent: main agent
- Original parent conversation ID: c70c15ba-260a-49fb-ac56-efe26db488cb

## 🔒 My Workflow
- **Pattern**: Project
- **Scope document**: c:\Vibecoding\superapp-monorepo\.agents\orchestrator\PROJECT.md
1. **Decompose**: Decompose the requirements into E2E testing track and 5 implementation milestones.
2. **Dispatch & Execute** (pick ONE):
   - **Delegate (sub-orchestrator)**: Spawn an E2E Testing Orchestrator and Sub-orchestrators for milestones.
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: At 16 spawns, write handoff.md, spawn successor.
- **Work items**:
  1. Initialize scope documents and plans [pending]
  2. Spawn E2E Testing Orchestrator [pending]
  3. Spawn Implementation Track Sub-orchestrators [pending]
  4. Final Integration & Verification [pending]
- **Current phase**: 1
- **Current focus**: Initialize scope documents and plans

## 🔒 Key Constraints
- benchmark integrity mode
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh

## Current Parent
- Conversation ID: c70c15ba-260a-49fb-ac56-efe26db488cb
- Updated: not yet

## Key Decisions Made
- Decomposed the project into two tracks: E2E Testing Track and Implementation Track.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| explorer_m1 | teamwork_preview_explorer | Milestone 1 Exploration | completed | b20f5909-d088-42e1-b11f-87f8778fd588 |
| e2e_tester | self | E2E Testing Track Orchestrator | in-progress | c96f5ac8-bf47-4496-b715-9ff7f9841803 |
| sub_orch_m3 | self | Milestone 3 Sub-orchestrator | in-progress | a399f9d5-d6f0-4226-9a50-dc56362f9fb6 |

## Succession Status
- Succession required: no
- Spawn count: 3 / 16
- Pending subagents: [c96f5ac8-bf47-4496-b715-9ff7f9841803, a399f9d5-d6f0-4226-9a50-dc56362f9fb6]
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: 51d8e7d7-9171-40ce-b970-a1943cb2dc76/task-45
- Safety timer: none
- On succession: kill all timers before spawning successor
- On context truncation: run manage_task(Action="list") — re-create if missing

## Artifact Index
- c:\Vibecoding\superapp-monorepo\.agents\orchestrator\PROJECT.md — Global index, architecture, milestones
- c:\Vibecoding\superapp-monorepo\.agents\orchestrator\plan.md — Detailed execution plan
- c:\Vibecoding\superapp-monorepo\.agents\orchestrator\progress.md — Status and heartbeat
- c:\Vibecoding\superapp-monorepo\.agents\orchestrator\context.md — Context and environment summary
