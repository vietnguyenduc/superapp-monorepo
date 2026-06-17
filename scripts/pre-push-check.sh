#!/bin/bash
# pre-push-check.sh — Git pre-push hook to prevent pushing to main
#
# Installation:
#   cp scripts/pre-push-check.sh .git/hooks/pre-push
#   chmod +x .git/hooks/pre-push

PROTECTED_BRANCHES="^(main|master)$"

while read local_ref local_sha remote_ref remote_sha; do
    # Extract the remote branch name
    remote_branch=$(echo "$remote_ref" | sed 's|refs/heads/||')

    if echo "$remote_branch" | grep -qE "$PROTECTED_BRANCHES"; then
        echo ""
        echo "=========================================================="
        echo "  [PRE-PUSH BLOCK] Push to '$remote_branch' is BLOCKED!"
        echo "=========================================================="
        echo ""
        echo "  Protected branches: main, master"
        echo "  Allowed targets: viet, devin/*, feature/*"
        echo ""
        echo "  To push to viet instead:"
        echo "    git push origin HEAD:viet"
        echo ""
        echo "  To bypass (NOT recommended):"
        echo "    git push --no-verify"
        echo ""
        exit 1
    fi
done

exit 0
