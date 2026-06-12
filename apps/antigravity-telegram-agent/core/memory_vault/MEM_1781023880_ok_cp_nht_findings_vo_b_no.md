# Task Objective
The objective was to update the internal knowledge base ("bộ não") with all findings from the recent session. This involved documenting specific bugs, their fixes, and updating the registry of services and modules.

# Strategy Used
The strategy involved a comprehensive update of the knowledge vault system. This included:
1.  **Expanding an existing `lessons_learned.md` file:** Adding a new section for "Repeating Bugs & Fixes" to centralize common issues and their solutions.
2.  **Creating a new detailed diagnostic file:** Documenting a specific complex error (`ERR_NGROK_8012`) with step-by-step diagnosis and fix instructions.
3.  **Updating the `global_registry_map.md`:** Registering new scripts and providing detailed descriptions for existing modules to enhance discoverability and understanding.
This proactive knowledge management ensures that recurring issues can be resolved automatically in the future without requiring human intervention.

# Code Snippets (Skills)
-   `vaults/lessons_learned.md` (file edited)
-   `vaults/devops/MEM_1780305678_err_ngrok_8012_upstream_connection_failed.md` (new file created)
-   `vaults/global_registry_map.md` (file updated)
-   `scripts/start_service.ps1` (script registered)
-   `-WindowStyle Hidden` (PowerShell parameter for `Start-Process`)
-   `-PassThru` (PowerShell parameter for `Start-Process`)
-   `curl.exe` (explicit command to bypass PowerShell alias)
-   `Invoke-WebRequest` (alternative PowerShell command for web requests)
-   `LISTEN` (concept for checking port status)
-   `$procId` (variable name used to avoid reserved `$pid`)

# Lessons Learned
-   **Succeeded:** The knowledge base was successfully updated, enhancing the system's ability to self-diagnose and fix common issues. The documentation of specific fixes for recurring bugs will improve future operational efficiency.
-   **Errors Healed/Bugs Addressed:**
    1.  **Start-Process timeout (120s):** Fixed by using `-WindowStyle Hidden` and `-PassThru` parameters.
    2.  **`curl` alias in PowerShell:** Resolved by explicitly using `curl.exe` or `Invoke-WebRequest`.
    3.  **`ERR_NGROK_8012` (Upstream Connection Failed):** Fixed by ensuring the target port is `LISTEN` before starting Flask, then waiting 3 seconds, and finally starting ngrok.
    4.  **`$pid` reserved variable:** Addressed by using `$procId` instead.
    5.  **Forgetting Antigravity CLI:** Highlighted the need for a pre-flight checklist and a strategy for reading large files (>500 lines) in sections.