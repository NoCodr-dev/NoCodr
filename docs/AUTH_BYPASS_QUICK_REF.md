# Authentication Bypass - Quick Reference

## 🚀 Quick Start

### Option 1: Using the Helper Script (Recommended)

```bash
# Create your development environment file
cp .env.development.example .env.development

# Edit and add your token
nano .env.development

# Run with bypass
./scripts/dev-no-auth.sh
```

### Option 2: Manual Setup

```bash
# Set environment variable
export ROO_CODE_CLOUD_TOKEN="your-jwt-token-here"

# Build and install
./rebuild-and-install.sh
```

## 📋 What Changes?

| Component | Production Mode | Development Mode (Bypass) |
|-----------|----------------|---------------------------|
| **Auth Service** | `WebAuthService` | `StaticTokenAuthService` |
| **Login Required** | ✅ Yes | ❌ No |
| **Session Refresh** | ✅ Every 50 seconds | ❌ Not needed |
| **isAuthenticated()** | Based on session | ✅ Always `true` |
| **hasActiveSession()** | Based on token | ✅ Always `true` |
| **User Info** | From Clerk API | From JWT payload |
| **Logout Available** | ✅ Yes | ❌ Throws error |
| **Switch Org** | ✅ Yes | ❌ Throws error |

## 🔑 Environment Variables

```bash
# Required for bypass
ROO_CODE_CLOUD_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Optional: Organization settings
ROO_CODE_CLOUD_ORG_SETTINGS='{"allowAll":true,"providers":{}}'

# Optional: Custom endpoints
CLERK_BASE_URL="https://your-dev-clerk.com"
ROO_CODE_API_URL="https://your-dev-api.com"
```

## 📁 Affected Files

### Core Authentication Files

| File | Lines | Purpose |
|------|-------|---------|
| `packages/cloud/src/CloudService.ts` | 107-122 | Chooses auth service based on env var |
| `packages/cloud/src/StaticTokenAuthService.ts` | 1-102 | Development bypass implementation |
| `packages/cloud/src/WebAuthService.ts` | Full file | Production authentication |
| `packages/cloud/src/config.ts` | 1-7 | API endpoint configuration |

### Configuration Detection

```typescript
// In CloudService.ts initialization
const cloudToken = process.env.ROO_CODE_CLOUD_TOKEN

if (cloudToken && cloudToken.length > 0) {
    // DEVELOPMENT MODE - Bypass enabled
    this._authService = new StaticTokenAuthService(this.context, cloudToken, this.log)
} else {
    // PRODUCTION MODE - Normal auth flow
    this._authService = new WebAuthService(this.context, this.log)
}
```

## 🧪 Testing Scenarios

### Scenario 1: Personal Account

```bash
# Token without organization ID
export ROO_CODE_CLOUD_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyIjp7InUiOiJ1c2VyXzEyMyIsInQiOiJhdXRoIn19.signature"
```

User info extracted:
```json
{
  "id": "user_123",
  "organizationId": undefined,
  "extensionBridgeEnabled": true
}
```

### Scenario 2: Organization Account

```bash
# Token with organization ID
export ROO_CODE_CLOUD_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyIjp7InUiOiJ1c2VyXzEyMyIsIm8iOiJvcmdfYWJjIiwidCI6ImNqIn19.signature"
```

User info extracted:
```json
{
  "id": "user_123",
  "organizationId": "org_abc",
  "extensionBridgeEnabled": true
}
```

## 🔍 How to Verify

### Check Developer Console

1. Open VS Code
2. Press `Cmd+Shift+P`
3. Type: "Developer: Toggle Developer Tools"
4. Look for log: `[auth] Using StaticTokenAuthService`

### Check in Code

```typescript
import { CloudService } from "@roo-code/cloud"

const cloudService = CloudService.instance

// Will always be true in bypass mode
console.log(cloudService.isAuthenticated()) // true
console.log(cloudService.hasActiveSession()) // true

// User info from JWT
const userInfo = cloudService.getUserInfo()
console.log(userInfo)
```

## 📝 JWT Token Structure

Required payload format:

```json
{
  "iss": "rcc",
  "sub": "job_id_or_user_id",
  "exp": 1756279754,
  "iat": 1756275854,
  "nbf": 1756275824,
  "v": 1,
  "r": {
    "u": "user_id",          // REQUIRED: User identifier
    "o": "organization_id",  // OPTIONAL: Organization identifier
    "t": "auth" | "cj"       // Token type (auth or cloud job)
  }
}
```

## 🛠️ Generate Token

```bash
pnpm --filter @roo-code-cloud/roomote-cli development auth job-token \
  --job-id 1 \
  --user-id user_YOUR_USER_ID \
  --org-id org_YOUR_ORG_ID
```

**Note**: Token expires in 1 hour

## 🔄 Switch Between Modes

### Switch to Development Mode

```bash
export ROO_CODE_CLOUD_TOKEN="your-token"
./rebuild-and-install.sh
```

### Switch to Production Mode

```bash
unset ROO_CODE_CLOUD_TOKEN
unset ROO_CODE_CLOUD_ORG_SETTINGS
unset CLERK_BASE_URL
unset ROO_CODE_API_URL
./rebuild-and-install.sh
```

## ⚠️ Limitations in Bypass Mode

Methods that will throw errors:

```typescript
// These will throw: "Authentication methods are disabled in StaticTokenAuthService"
await authService.login()
await authService.logout()
await authService.handleCallback(code, state)
await authService.switchOrganization(orgId)
await authService.getOrganizationMemberships()
```

Methods that work normally:

```typescript
authService.isAuthenticated()           // Always true
authService.hasActiveSession()          // Always true
authService.getState()                  // "active-session"
authService.getSessionToken()           // Returns the token
authService.getUserInfo()               // Parsed from JWT
authService.getStoredOrganizationId()  // From JWT payload
```

## 📊 Comparison Table

| Feature | Production | Development Bypass |
|---------|-----------|-------------------|
| Login UI | Required | Not shown |
| Session Management | Active refresh | No refresh needed |
| Token Validation | Clerk API | JWT decode only |
| User Info Source | Clerk `/me` endpoint | JWT payload |
| Organization Switch | Supported | Not supported |
| Token Lifetime | Dynamic | Fixed (1 hour) |
| Environment Setup | None | Requires env var |
| Security | Full OAuth flow | Static token |

## 🎯 Use Cases

### ✅ Good for:
- Local development
- Testing without internet
- Automated testing
- Quick prototyping
- Debugging auth-dependent features

### ❌ Not suitable for:
- Production builds
- Testing actual auth flows
- Organization switching features
- Session refresh testing
- Security testing

## 🔐 Security Notes

1. **Never commit tokens** to version control
2. **Add `.env*`** to `.gitignore`
3. **Rotate tokens** regularly
4. **Use separate tokens** per developer
5. **Never deploy** with bypass enabled

## 📞 Troubleshooting

### Token Not Working

```bash
# Verify environment variable
echo $ROO_CODE_CLOUD_TOKEN

# Check token format (should be JWT)
node -e "console.log(JSON.parse(Buffer.from('$ROO_CODE_CLOUD_TOKEN'.split('.')[1], 'base64')))"

# Check expiration
date -r $(node -e "console.log(JSON.parse(Buffer.from('$ROO_CODE_CLOUD_TOKEN'.split('.')[1], 'base64')).exp)")
```

### Still Asks for Login

1. Verify token is set before VS Code starts
2. Restart VS Code completely (Cmd+Q)
3. Check developer console for auth service type
4. Rebuild with: `./rebuild-and-install.sh`

### Features Not Working

1. Check token has correct payload structure
2. Verify `r.u` exists for user ID
3. Add `r.o` if organization features needed
4. Set `ROO_CODE_CLOUD_ORG_SETTINGS` if needed

---

**Documentation**: See [DEVELOPMENT_AUTH_BYPASS.md](./DEVELOPMENT_AUTH_BYPASS.md) for full details
**Script**: Use [scripts/dev-no-auth.sh](./scripts/dev-no-auth.sh) for automated setup
