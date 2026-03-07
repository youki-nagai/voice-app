#!/bin/bash

# Get current branch name
branch_name=$(git rev-parse --abbrev-ref HEAD)

# Check if branch name contains non-ASCII characters (non-English)
if ! echo "$branch_name" | grep -q '^[a-zA-Z0-9/_.-]*$'; then
    echo "❌ Error: Branch name contains non-English characters: $branch_name"
    echo "✅ Branch names must be in English only."
    echo "✅ Example: feature/add-login, fix/user-auth-bug"
    exit 1
fi

# Check if branch name contains uppercase letters
if echo "$branch_name" | grep -q '[A-Z]'; then
    echo "❌ Error: Branch name contains uppercase letters: $branch_name"
    echo "✅ Branch names must be in lowercase only."
    echo "✅ Example: feature/add-login, fix/user-auth-bug (not Feature/Add-Login)"
    exit 1
fi

# Check if branch name follows naming convention
if ! echo "$branch_name" | grep -qE '^(main|develop|feature/[a-z0-9\-]+|fix/[a-z0-9\-]+|hotfix/[a-z0-9\-]+|release/[a-z0-9\-\.]+|chore/[a-z0-9\-]+|docs/[a-z0-9\-]+|test/[a-z0-9\-]+)$'; then
    echo "⚠️  Warning: Branch name '$branch_name' doesn't follow the naming convention."
    echo "✅ Recommended patterns:"
    echo "   - feature/description"
    echo "   - fix/description"
    echo "   - hotfix/description"
    echo "   - release/version"
    echo "   - chore/description"
    echo "   - docs/description"
    echo "   - test/description"
    # Warning only, not blocking
fi

echo "✅ Branch name is valid: $branch_name"
exit 0
