#!/bin/bash

################################################################################
# NoCodr Development Script - Authentication Bypass
# 
# This script runs the extension in development mode with authentication bypass
# allowing you to test without going through the login flow.
#
# Usage: 
#   ./scripts/dev-no-auth.sh [token]
#
# Examples:
#   ./scripts/dev-no-auth.sh                    # Use token from .env.development
#   ./scripts/dev-no-auth.sh "your-jwt-token"   # Use provided token
#
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║     NoCodr Development Mode - Authentication Bypass          ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Function to print step headers
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
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Step 1: Load environment variables
print_step "Step 1: Loading Development Environment"

# Check if .env.development exists
if [[ -f "$PROJECT_ROOT/.env.development" ]]; then
    print_info "Loading .env.development file..."
    source "$PROJECT_ROOT/.env.development"
    print_success "Environment variables loaded from .env.development"
else
    print_warning "No .env.development file found"
    print_info "You can create one from .env.development.example"
fi

# Use provided token or environment variable
if [[ -n "$1" ]]; then
    export ROO_CODE_CLOUD_TOKEN="$1"
    print_success "Using provided token"
elif [[ -n "$ROO_CODE_CLOUD_TOKEN" ]]; then
    print_success "Using token from environment"
else
    print_error "No authentication token provided!"
    echo ""
    print_info "You can:"
    echo "  1. Pass token as argument: ./scripts/dev-no-auth.sh \"your-token\""
    echo "  2. Set ROO_CODE_CLOUD_TOKEN in .env.development"
    echo "  3. Generate a token with:"
    echo "     pnpm --filter @roo-code-cloud/roomote-cli development auth job-token \\"
    echo "       --job-id 1 \\"
    echo "       --user-id user_YOUR_USER_ID \\"
    echo "       --org-id org_YOUR_ORG_ID"
    echo ""
    exit 1
fi

# Set default organization settings if not provided
if [[ -z "$ROO_CODE_CLOUD_ORG_SETTINGS" ]]; then
    export ROO_CODE_CLOUD_ORG_SETTINGS='{"allowAll":true,"providers":{}}'
    print_info "Using default organization settings (allowAll)"
fi

# Step 2: Display configuration
print_step "Step 2: Development Configuration"

echo -e "${CYAN}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│${NC} ${YELLOW}Mode:${NC} Development (Authentication Bypass)"
echo -e "${CYAN}│${NC}"
echo -e "${CYAN}│${NC} ${YELLOW}Auth Service:${NC} StaticTokenAuthService"
echo -e "${CYAN}│${NC} ${YELLOW}Token:${NC} ${ROO_CODE_CLOUD_TOKEN:0:20}...${ROO_CODE_CLOUD_TOKEN: -10}"
echo -e "${CYAN}│${NC}"

if [[ -n "$CLERK_BASE_URL" ]]; then
    echo -e "${CYAN}│${NC} ${YELLOW}Clerk URL:${NC} $CLERK_BASE_URL"
else
    echo -e "${CYAN}│${NC} ${YELLOW}Clerk URL:${NC} https://clerk.roocode.com (production)"
fi

if [[ -n "$ROO_CODE_API_URL" ]]; then
    echo -e "${CYAN}│${NC} ${YELLOW}API URL:${NC} $ROO_CODE_API_URL"
else
    echo -e "${CYAN}│${NC} ${YELLOW}API URL:${NC} https://app.roocode.com (production)"
fi

echo -e "${CYAN}│${NC}"
echo -e "${CYAN}│${NC} ${YELLOW}Organization Settings:${NC}"
echo -e "${CYAN}│${NC}   $ROO_CODE_CLOUD_ORG_SETTINGS"
echo -e "${CYAN}└─────────────────────────────────────────────────────────────┘${NC}"

# Step 3: Build and install
print_step "Step 3: Building Extension"

cd "$PROJECT_ROOT"

if [[ -f "./rebuild-and-install.sh" ]]; then
    print_info "Running rebuild-and-install.sh with development environment..."
    ./rebuild-and-install.sh --skip-git
else
    print_error "rebuild-and-install.sh not found!"
    exit 1
fi

# Step 4: Summary
print_step "✨ Development Setup Complete!"

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                   DEVELOPMENT MODE ACTIVE                     ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║                                                               ║"
echo "║  ✓ Authentication Bypass Enabled                             ║"
echo "║  ✓ Static Token Auth Active                                  ║"
echo "║  ✓ No Login Required                                         ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

print_warning "IMPORTANT NOTES:"
echo ""
echo "  1. This is DEVELOPMENT MODE - not for production use"
echo "  2. Token expires after 1 hour (regenerate if needed)"
echo "  3. All authentication checks will pass automatically"
echo "  4. Organization features depend on token payload"
echo ""

print_info "Next steps:"
echo "  1. Quit VS Code completely (Cmd+Q)"
echo "  2. Reopen VS Code"
echo "  3. Extension will start WITHOUT requiring login"
echo ""

print_info "To verify bypass is active:"
echo "  - Check VS Code Developer Console"
echo "  - Look for: '[auth] Using StaticTokenAuthService'"
echo ""

print_info "To return to normal mode:"
echo "  - Run: unset ROO_CODE_CLOUD_TOKEN"
echo "  - Rebuild: ./rebuild-and-install.sh"
echo ""

print_success "Ready for development! 🚀"
