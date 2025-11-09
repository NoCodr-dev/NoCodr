# Development Authentication Bypass Guide

This document explains how to bypass authentication for development and testing purposes in the NoCodr extension.

## Overview

The NoCodr extension supports two authentication modes:
1. **Production Mode**: Normal authentication flow using Clerk (WebAuthService)
2. **Development Mode**: Bypass authentication using a static token (StaticTokenAuthService)

## Environment Variables

### Authentication Bypass

Set the following environment variable to bypass login:

```bash
export ROO_CODE_CLOUD_TOKEN="your-development-token-here"
```

### Organization Settings Bypass

To bypass organization settings:

```bash
export ROO_CODE_CLOUD_ORG_SETTINGS='{"allowAll":true,"providers":{}}'
```

### Custom API Endpoints (Optional)

For testing against non-production environments:

```bash
export CLERK_BASE_URL="https://your-dev-clerk-instance.com"
export ROO_CODE_API_URL="https://your-dev-api.com"
```

## How It Works

### Code Location: `packages/cloud/src/CloudService.ts` (Lines 107-122)

```typescript
public async initialize(): Promise<void> {
    if (this.isInitialized) {
        return
    }

    try {
        // For testing you can create a token with:
        // `pnpm --filter @roo-code-cloud/roomote-cli development auth job-token --job-id 1 --user-id user_2xmBhejNeDTwanM8CgIOnMgVxzC --org-id org_2wbhchVXZMQl8OS1yt0mrDazCpW`
        // The token will last for 1 hour.
        const cloudToken = process.env.ROO_CODE_CLOUD_TOKEN

        if (cloudToken && cloudToken.length > 0) {
            this._authService = new StaticTokenAuthService(this.context, cloudToken, this.log)
        } else {
            this._authService = new WebAuthService(this.context, this.log)
        }
        // ... rest of initialization
    }
}
```

### Affected Components

When `ROO_CODE_CLOUD_TOKEN` is set, the following changes occur:

1. **Authentication Service**
   - Uses `StaticTokenAuthService` instead of `WebAuthService`
   - Location: `packages/cloud/src/StaticTokenAuthService.ts`
   - Always returns `isAuthenticated() = true`
   - Always returns `hasActiveSession() = true`
   - Throws errors for login/logout/switchOrganization methods

2. **User Info**
   - Extracts user information from JWT token payload
   - Automatically enables `extensionBridgeEnabled = true`

3. **Session Management**
   - No session refresh required
   - Token remains valid as long as environment variable is set

## Configuration Defaults

### Production URLs (config.ts)

```typescript
export const PRODUCTION_CLERK_BASE_URL = "https://clerk.roocode.com"
export const PRODUCTION_ROO_CODE_API_URL = "https://app.roocode.com"

export const getClerkBaseUrl = () => process.env.CLERK_BASE_URL || PRODUCTION_CLERK_BASE_URL
export const getRooCodeApiUrl = () => process.env.ROO_CODE_API_URL || PRODUCTION_ROO_CODE_API_URL
```

## Usage Examples

### Example 1: Basic Development Setup

Create a `.env.development` file in your project root:

```bash
# Development Authentication Bypass
ROO_CODE_CLOUD_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Organization Settings (Allow All)
ROO_CODE_CLOUD_ORG_SETTINGS='{"allowAll":true,"providers":{}}'
```

Load it before running:

```bash
# Load environment variables
source .env.development

# Run the extension
./rebuild-and-install.sh
```

### Example 2: VS Code Launch Configuration

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension (Dev Mode - No Auth)",
      "type": "extensionHost",
      "request": "launch",
      "runtimeExecutable": "${execPath}",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}/src"],
      "env": {
        "ROO_CODE_CLOUD_TOKEN": "your-dev-token-here",
        "ROO_CODE_CLOUD_ORG_SETTINGS": "{\"allowAll\":true,\"providers\":{}}"
      },
      "outFiles": ["${workspaceFolder}/src/dist/**/*.js"]
    }
  ]
}
```

### Example 3: Shell Script for Development

Create `dev-run.sh`:

```bash
#!/bin/bash

# Development mode with authentication bypass
export ROO_CODE_CLOUD_TOKEN="your-dev-token-here"
export ROO_CODE_CLOUD_ORG_SETTINGS='{"allowAll":true,"providers":{}}'

# Optional: Use development API endpoints
# export CLERK_BASE_URL="https://dev-clerk.roocode.com"
# export ROO_CODE_API_URL="https://dev-api.roocode.com"

# Build and install
./rebuild-and-install.sh

echo "✅ Development environment loaded with auth bypass"
```

## Generating Development Tokens

According to the code comments, you can generate tokens using:

```bash
pnpm --filter @roo-code-cloud/roomote-cli development auth job-token \
  --job-id 1 \
  --user-id user_2xmBhejNeDTwanM8CgIOnMgVxzC \
  --org-id org_2wbhchVXZMQl8OS1yt0mrDazCpW
```

**Note**: The generated token will last for 1 hour.

## JWT Token Structure

The static token service expects JWT tokens with this payload structure:

```typescript
{
  "iss": "rcc",
  "sub": "job_id_or_user_id",
  "exp": 1756279754,
  "iat": 1756275854,
  "nbf": 1756275824,
  "v": 1,
  "r": {
    "u": "user_id",           // User ID
    "o": "organization_id",   // Organization ID (optional)
    "t": "auth" | "cj"        // Token type
  }
}
```

## Testing Scenarios

### Scenario 1: Test Without Authentication

```bash
# Don't set ROO_CODE_CLOUD_TOKEN
# Extension will use WebAuthService and require login
./rebuild-and-install.sh
```

### Scenario 2: Test With Bypass (Personal Account)

```bash
export ROO_CODE_CLOUD_TOKEN="token-without-org-id"
./rebuild-and-install.sh
```

### Scenario 3: Test With Bypass (Organization Account)

```bash
export ROO_CODE_CLOUD_TOKEN="token-with-org-id"
./rebuild-and-install.sh
```

## Detecting Mode in Code

To check if you're in development mode with bypass:

```typescript
import { CloudService, getClerkBaseUrl, PRODUCTION_CLERK_BASE_URL } from "@roo-code/cloud"

// Check if using production clerk
const isProduction = getClerkBaseUrl() === PRODUCTION_CLERK_BASE_URL

// Check if using static token (development bypass)
const isDevelopmentBypass = process.env.ROO_CODE_CLOUD_TOKEN !== undefined

if (isDevelopmentBypass) {
  console.log("🔧 Running in DEVELOPMENT mode with auth bypass")
} else if (isProduction) {
  console.log("🚀 Running in PRODUCTION mode")
} else {
  console.log("🧪 Running against custom endpoints")
}
```

## Affected Files

Here are the key files involved in authentication bypass:

1. **CloudService.ts** - Main service that switches between auth modes
   - Location: `packages/cloud/src/CloudService.ts`
   - Lines: 107-122 (initialization logic)

2. **StaticTokenAuthService.ts** - Development bypass implementation
   - Location: `packages/cloud/src/StaticTokenAuthService.ts`
   - Always authenticated, no login/logout

3. **WebAuthService.ts** - Production authentication
   - Location: `packages/cloud/src/WebAuthService.ts`
   - Full Clerk integration, session management

4. **config.ts** - Environment configuration
   - Location: `packages/cloud/src/config.ts`
   - API endpoint configuration

## Security Notes

⚠️ **WARNING**: Never commit development tokens to version control!

- Add `.env*` to `.gitignore`
- Use separate tokens for each developer
- Rotate tokens regularly
- Never use development bypass in production builds

## Troubleshooting

### Token Not Working

1. Check token format (must be valid JWT)
2. Verify environment variable is set: `echo $ROO_CODE_CLOUD_TOKEN`
3. Check token expiration
4. Ensure token payload has required fields (`r.u` for user ID)

### Extension Still Asks for Login

1. Restart VS Code completely (Cmd+Q)
2. Verify environment variable is loaded before VS Code starts
3. Check VS Code Developer Console for auth logs

### Organization Features Not Working

1. Ensure token has `r.o` field for organization ID
2. Set `ROO_CODE_CLOUD_ORG_SETTINGS` for organization-specific settings
3. Check organization ID matches in both token and settings

## Cleanup

To switch back to production mode:

```bash
# Remove environment variables
unset ROO_CODE_CLOUD_TOKEN
unset ROO_CODE_CLOUD_ORG_SETTINGS
unset CLERK_BASE_URL
unset ROO_CODE_API_URL

# Rebuild and install
./rebuild-and-install.sh
```

---

**Last Updated**: 2025-01-09
**Version**: 1.0.1
