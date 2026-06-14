# BRIEFING — 2026-06-15T01:16:26+07:00

## Mission
Implement conversational onboarding, Supabase Auth-based email OTP verification, and linking verified emails to users' Telegram IDs.

## 🔒 My Identity
- Archetype: sub-orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: c:\Vibecoding\superapp-monorepo\.agents\sub_orch_m3_auth
- Original parent: main agent
- Original parent conversation ID: 51d8e7d7-9171-40ce-b970-a1943cb2dc76

## 🔒 My Workflow
- **Pattern**: Project (Sub-orchestrator mode)
- **Scope document**: c:\Vibecoding\superapp-monorepo\.agents\sub_orch_m3_auth\SCOPE.md
1. **Decompose**: Decomposed into 4 sequential sub-tasks: 3.1 Database Migrations, 3.2 Code Refactoring, 3.3 Conversation Flow, 3.4 Verification.
2. **Dispatch & Execute** (pick ONE):
   - **Direct (iteration loop)**: For each sub-task/milestone, we will spawn Explorer -> Worker -> Reviewer -> Challenger -> Auditor.
   - **Delegate (sub-orchestrator)**: N/A for this sub-orchestrator.
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: At spawn count >= 16, write handoff.md, spawn successor, and exit.
- **Work items**:
  1. 3.1 Database Migrations [pending]
  2. 3.2 Code Refactoring [pending]
  3. 3.3 Conversation Flow [pending]
  4. 3.4 Verification [pending]
- **Current phase**: 1
- **Current focus**: 3.1 Database Migrations

## 🔒 Key Constraints
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- You MAY use file-editing tools ONLY for metadata/state files (.md) in your .agents/ folder.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh

## Current Parent
- Conversation ID: 51d8e7d7-9171-40ce-b970-a1943cb2dc76
- Updated: not yet

## Key Decisions Made
- Use direct execution loop per sub-task.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| explorer_3_1_1 | explorer | 3.1 DB Migrations Exploration | completed | 1de83e25-6109-4213-b627-280e02295984 |
| explorer_3_1_2 | explorer | 3.1 DB Migrations Exploration | completed | afdb24c1-14ff-4a5e-a9cb-58fa15822f94 |
| explorer_3_1_3 | explorer | 3.1 DB Migrations Exploration | completed | df57299b-1b15-4ac9-b1a5-72252a217d43 |
| worker_3_1 | worker | 3.1 DB Migrations Implementation | completed | 674d43d8-79ee-4d04-9fc4-6ae7eb1addf5 |
| reviewer_3_1_1 | reviewer | 3.1 DB Migrations Review | completed | 592deccf-140b-4854-a821-c67eb03135ea |
| reviewer_3_1_2 | reviewer | 3.1 DB Migrations Review | completed | 27fa938d-d553-438c-a17b-cdf3447853c4 |
| explorer_3_2_1 | explorer | 3.2 Code Refactoring Exploration | completed | 5f05dda9-ee07-4def-9413-8d4e0fe4cd9c |
| explorer_3_2_2 | explorer | 3.2 Code Refactoring Exploration | completed | 9ed17625-273f-42f7-b7c6-616dc0e0ebd8 |
| explorer_3_2_3 | explorer | 3.2 Code Refactoring Exploration | completed | a500b679-94a8-4ec8-92fa-89a96614c796 |
| worker_3_2 | worker | 3.2 Code Refactoring Implementation | in-progress | d60b9e32-6e42-4a06-aa01-d40bdaf97491 |

## Succession Status
- Succession required: no
- Spawn count: 10 / 16
- Pending subagents: d60b9e32-6e42-4a06-aa01-d40bdaf97491
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: task-57
- Safety timer: task-181
- On succession: kill all timers before spawning successor
- On context truncation: run `manage_task(Action="list")` — re-create if missing

## Artifact Index
- c:\Vibecoding\superapp-monorepo\.agents\sub_orch_m3_auth\SCOPE.md — Milestone Scope Document
- c:\Vibecoding\superapp-monorepo\.agents\sub_orch_m3_auth\instruction.md — Detailed Task Instructions
- c:\Vibecoding\superapp-monorepo\.agents\sub_orch_m3_auth\progress.md — Execution Progress Heartbeat
