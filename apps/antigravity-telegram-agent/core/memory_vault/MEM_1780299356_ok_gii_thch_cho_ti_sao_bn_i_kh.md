# Task Objective
To understand and explain why the Antigravity CLI's capabilities are sometimes forgotten or underutilized, despite their availability.

# Strategy Used
The strategy involved identifying the root cause as "Context Window Drift," where long file logs, large file contents (e.g., `main.py` 1152 lines), and extensive conversation history push Antigravity CLI tools out of the short-term memory (context window). Specific instances of forgetting `write_file` and `antigravity fix` were analyzed. The adopted solution was to consciously prioritize Antigravity CLI tools over PowerShell alternatives for file patching, command execution, and reading.

# Code Snippets (Skills)
*   `write_file` (Antigravity CLI) - Used for patching files.
*   `antigravity fix` (Antigravity CLI) - Identified as a forgotten but available tool for debugging.
*   `execute_command` (Antigravity CLI) - Prioritized for running commands.
*   `read_file` (Antigravity CLI) - Prioritized for reading files.
*   `PowerShell sed` (PowerShell) - Identified as an alternative to be avoided in favor of `write_file`.
*   `Select-String`, `for` loop (PowerShell) - Identified as complex alternatives to be avoided.

# Lessons Learned
*   **Succeeded:** Successfully used `write_file` for patching two locations, eliminated the need for complex PowerShell loops, and confirmed cache-busting functionality.
*   **Failed:** The primary failure was forgetting available Antigravity CLI tools (`write_file`, `antigravity fix`) due to context window overload from large files and long conversation history.
*   **Errors Healed:** The error of forgetting tools was healed by being reminded, leading to immediate application of the correct Antigravity CLI tools.
*   **New Prevention Mechanism:** A commitment was made to prioritize Antigravity CLI tools (`write_file`, `execute_command`, `read_file`) before considering PowerShell for file operations and command execution. Additionally, for files exceeding 500 lines, the strategy will be to read them in parts rather than the whole file to mitigate context window drift.