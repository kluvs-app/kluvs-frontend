#!/bin/bash
# The purpose of this script is to execute the 2nd step in our release process.
#
# This consist of running the `update-lib-version.sh` script from the tools/ directory,
# and committing the changes that this script generates directly into our release branch.

if [ -z "$1" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 1.0.0"
  exit 1
fi
VERSION_NAME="$1"

echo "2️⃣ Updating library version to $VERSION_NAME..."

npm version "$VERSION_NAME" --no-git-tag-version
echo "export const VERSION = '$VERSION_NAME'" > src/version.ts
git add package.json package-lock.json src/version.ts
echo "Changes to commit:"
git --no-pager diff --cached
git commit -m "Bump version to $VERSION_NAME"

echo "✅ Version updated and committed for release v$VERSION_NAME"