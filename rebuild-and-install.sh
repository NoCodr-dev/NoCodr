#!/bin/bash

################################################################################
# NoCoder Extension - Automated Build, Version Update & Installation Script
# 
# This script automates the complete workflow:
# 1. Updates version in package.json files
# 2. Cleans previous builds
# 3. Builds new VSIX package
# 4. Uninstalls old version from VS Code
# 5. Installs new version
# 6. Commits and pushes changes (optional)
#
# Usage: 
#   ./rebuild-and-install.sh [version] [--skip-git]
#   
# Examples:
#   ./rebuild-and-install.sh 1.0.1
#   ./rebuild-and-install.sh 1.0.2 --skip-git
#
# Author: NoCoder Inc.
# License: Apache 2.0
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EXTENSION_ID="nocodr-dev.nocodr"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_PACKAGE_JSON="$PROJECT_ROOT/src/package.json"
ROOT_PACKAGE_JSON="$PROJECT_ROOT/package.json"
BIN_DIR="$PROJECT_ROOT/bin"
BRANCH_NAME="superset_nocodr"

# Parse arguments
NEW_VERSION="$1"
SKIP_GIT=false

if [[ "$2" == "--skip-git" ]] || [[ "$1" == "--skip-git" ]]; then
    SKIP_GIT=true
fi

################################################################################
# Helper Functions
################################################################################

print_step() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📍 $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Get current version from package.json
get_current_version() {
    if [[ -f "$SRC_PACKAGE_JSON" ]]; then
        grep -m 1 '"version"' "$SRC_PACKAGE_JSON" | sed 's/.*"version": "\(.*\)".*/\1/'
    else
        echo "0.0.0"
    fi
}

# Update version in package.json file
update_package_version() {
    local file=$1
    local version=$2
    
    if [[ -f "$file" ]]; then
        # Use sed to update version (macOS compatible)
        sed -i '' "s/\"version\": \".*\"/\"version\": \"$version\"/" "$file"
        print_success "Updated version in $(basename $file)"
    else
        print_error "File not found: $file"
        return 1
    fi
}

# Check if VS Code CLI is available
check_vscode_cli() {
    if ! command -v code &> /dev/null; then
        print_error "VS Code CLI 'code' command not found in PATH"
        print_info "Install it via: VS Code → Command Palette → 'Install code command in PATH'"
        exit 1
    fi
}

# Setup Node.js environment
setup_node_env() {
    export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found in PATH"
        print_info "Please install Node.js 20.19.2"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm not found in PATH"
        print_info "Install it via: brew install pnpm"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    PNPM_VERSION=$(pnpm --version)
    print_success "Node.js: $NODE_VERSION | pnpm: $PNPM_VERSION"
}

################################################################################
# Main Script
################################################################################

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║        NoCoder Extension - Build & Install Script            ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Step 1: Validate environment
print_step "Step 1: Validating Environment"
check_vscode_cli
setup_node_env

# Step 2: Get current version and validate new version
print_step "Step 2: Version Management"
CURRENT_VERSION=$(get_current_version)
print_info "Current version: $CURRENT_VERSION"

if [[ -z "$NEW_VERSION" ]]; then
    print_warning "No version specified. Using current version: $CURRENT_VERSION"
    NEW_VERSION="$CURRENT_VERSION"
else
    print_info "New version: $NEW_VERSION"
    
    # Validate version format (semantic versioning)
    if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_error "Invalid version format. Use semantic versioning (e.g., 1.0.1)"
        exit 1
    fi
fi

# Step 3: Update version in package.json files
if [[ "$NEW_VERSION" != "$CURRENT_VERSION" ]]; then
    print_step "Step 3: Updating Version in Package Files"
    update_package_version "$ROOT_PACKAGE_JSON" "$NEW_VERSION"
    update_package_version "$SRC_PACKAGE_JSON" "$NEW_VERSION"
    print_success "Version updated from $CURRENT_VERSION to $NEW_VERSION"
else
    print_step "Step 3: Version Update"
    print_info "Version unchanged: $NEW_VERSION"
fi

# Step 4: Clean previous builds
print_step "Step 4: Cleaning Previous Builds"
cd "$PROJECT_ROOT"

if [[ -d "$BIN_DIR" ]]; then
    print_info "Removing old VSIX files from bin directory..."
    rm -f "$BIN_DIR"/*.vsix
    print_success "Cleaned bin directory"
fi

# Step 5: Build VSIX package
print_step "Step 5: Building VSIX Package"
print_info "Running: pnpm vsix"

if pnpm vsix; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Verify VSIX was created
VSIX_FILE="$BIN_DIR/nocodr-$NEW_VERSION.vsix"
if [[ ! -f "$VSIX_FILE" ]]; then
    print_error "VSIX file not found: $VSIX_FILE"
    exit 1
fi

VSIX_SIZE=$(du -h "$VSIX_FILE" | cut -f1)
print_success "VSIX created: nocodr-$NEW_VERSION.vsix ($VSIX_SIZE)"

# Step 6: Uninstall old version from VS Code
print_step "Step 6: Uninstalling Old Version from VS Code"

# Check if extension is installed
if code --list-extensions | grep -q "$EXTENSION_ID"; then
    INSTALLED_VERSION=$(code --list-extensions --show-versions | grep "$EXTENSION_ID" | cut -d'@' -f2)
    print_info "Found installed version: $INSTALLED_VERSION"
    
    print_info "Uninstalling $EXTENSION_ID..."
    if code --uninstall-extension "$EXTENSION_ID"; then
        print_success "Old version uninstalled"
    else
        print_warning "Uninstall failed or extension not found (continuing anyway)"
    fi
else
    print_info "No previous version found (first install)"
fi

# Step 7: Install new version
print_step "Step 7: Installing New Version"
print_info "Installing: nocodr-$NEW_VERSION.vsix"

if code --install-extension "$VSIX_FILE" --force; then
    print_success "Extension installed successfully"
else
    print_error "Installation failed"
    exit 1
fi

# Verify installation
if code --list-extensions | grep -q "$EXTENSION_ID"; then
    NEW_INSTALLED_VERSION=$(code --list-extensions --show-versions | grep "$EXTENSION_ID" | cut -d'@' -f2)
    print_success "Verified installation: $EXTENSION_ID@$NEW_INSTALLED_VERSION"
else
    print_error "Installation verification failed"
    exit 1
fi

# Step 8: Git commit and push (optional)
if [[ "$SKIP_GIT" == false ]] && [[ "$NEW_VERSION" != "$CURRENT_VERSION" ]]; then
    print_step "Step 8: Committing and Pushing Changes"
    
    # Check if there are changes to commit
    if git diff --quiet HEAD -- "$ROOT_PACKAGE_JSON" "$SRC_PACKAGE_JSON"; then
        print_info "No version changes to commit"
    else
        print_info "Staging package.json files..."
        git add "$ROOT_PACKAGE_JSON" "$SRC_PACKAGE_JSON"
        
        COMMIT_MSG="chore: bump version to $NEW_VERSION

- Update version in root package.json
- Update version in src/package.json
- Build nocodr-$NEW_VERSION.vsix"
        
        print_info "Creating commit..."
        if git commit --no-verify -m "$COMMIT_MSG"; then
            print_success "Commit created"
            
            print_info "Pushing to $BRANCH_NAME..."
            if git push origin "$BRANCH_NAME" --no-verify; then
                print_success "Changes pushed to GitHub"
            else
                print_warning "Push failed (you may need to push manually)"
            fi
        else
            print_warning "Commit failed (no changes or conflict)"
        fi
    fi
else
    if [[ "$SKIP_GIT" == true ]]; then
        print_step "Step 8: Git Operations"
        print_info "Skipping Git operations (--skip-git flag)"
    fi
fi

# Step 9: Summary
print_step "✨ Build & Installation Complete!"

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                      SUMMARY                                  ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║  Extension ID: $EXTENSION_ID"
echo "║  Version:      $NEW_VERSION"
echo "║  VSIX File:    nocodr-$NEW_VERSION.vsix ($VSIX_SIZE)"
echo "║  Location:     $BIN_DIR"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

print_info "Next steps:"
echo "  1. Quit VS Code completely (Cmd+Q)"
echo "  2. Reopen VS Code"
echo "  3. Verify the new version in the NoCoder panel"
echo ""
print_success "All done! 🚀"
