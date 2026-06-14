# Worker Refinement Task Details

Objective:
Refine the implemented E2E test suite by resolving reviewer feedback.

Tasks:
1. Open `apps/superapp-business-bot/tests/test_e2e_r2_roles.py` and add `import time` at the top of the file to fix the NameError in `test_r2_trial_session_expiration`.
2. Rename the following legacy diagnostic scripts in `apps/superapp-business-bot/tests/` to prevent pytest discovery warnings and conflicts:
   - `test_ingestion_scenarios.py` -> `run_ingestion_scenarios.py`
   - `test_cleaning_scenarios.py` -> `run_cleaning_scenarios.py`
   - `test_export_csv.py` -> `run_export_csv.py`
3. Run the complete E2E test suite using `pytest tests/ -v` inside `apps/superapp-business-bot` directory and verify that all 49 tests pass without discovery warnings.
4. Update `TEST_READY.md` or `TEST_INFRA.md` if any paths changed.

MANDATORY INTEGRITY WARNING:
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.

Output Requirements:
- Write a handoff report (`handoff.md`) in your working directory `c:\Vibecoding\superapp-monorepo\.agents\worker_e2e_refine\`.
- Report passing tests, list commands executed, and output of pytest.
