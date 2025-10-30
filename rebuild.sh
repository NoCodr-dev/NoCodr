#!/bin/bash
set -e

echo "===== NoCodr Build Script ====="
echo "Starting build at: $(date)"

# Source nvm
source ~/.nvm/nvm.sh
nvm use 20.19.2

# Navigate to project
cd /Users/gdkn/Desktop/WebProjects/NoCodr/NoCodr

# Run build
echo "Running pnpm vsix..."
pnpm vsix

# List result
echo ""
echo "===== Build Complete ====="
ls -lh bin/*.vsix
echo "Build finished at: $(date)"
