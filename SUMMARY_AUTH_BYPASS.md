# 🔐 Authentication Bypass Implementation Summary

## Overview

The NoCodr extension supports **bypassing authentication** for development and testing by using the `ROO_CODE_CLOUD_TOKEN` environment variable. This switches the authentication service from `WebAuthService` (production) to `StaticTokenAuthService` (development).

---

## ⚡ Quick Start (TL;DR)

```bash
# Method 1: Using helper script (recommended)
cp .env.development.example .env.development
# Edit .env.development and add your token
./scripts/dev-no-auth.sh

# Method 2: Manual
export ROO_CODE_CLOUD_TOKEN="your-jwt-token-here"
./rebuild-and-install.sh
```

---

## 📋 Created Files

| File | Purpose |
|------|---------|
| `DEVELOPMENT_AUTH_BYPASS.md` | Complete guide with all details |
| `docs/AUTH_BYPASS_QUICK_REF.md` | Quick reference and cheat sheet |
| `.env.development.example` | Template for environment variables |
| `scripts/dev-no-auth.sh` | Automated setup script |

---

## 🔑 Key Environment Variables

### Required for Bypass

```bash
ROO_CODE_CLOUD_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Optional

```bash
# Organization settings bypass
ROO_CODE_CLOUD_ORG_SETTINGS='{"allowAll":true,"providers":{}}'

# Custom API endpoints
CLERK_BASE_URL="https://your-dev-clerk.com"
ROO_CODE_API_URL="https://your-dev-api.com"
```

---

## 📂 Affected Code Files

### Primary Files

1. **`packages/cloud/src/CloudService.ts`** (Lines 107-122)
   - Initialization logic that checks `process.env.ROO_CODE_CLOUD_TOKEN`
   - Switches between `StaticTokenAuthService` and `WebAuthService`

2. **`packages/cloud/src/StaticTokenAuthService.ts`** (Full file)
   - Development bypass implementation
   - Always returns `isAuthenticated() = true`
   - Always returns `hasActiveSession() = true`
   - Parses user info from JWT payload
   - Throws errors for login/logout/switchOrganization

3. **`packages/cloud/src/WebAuthService.ts`** (Full file)
   - Production authentication with full Clerk integration
   - Session management and refresh
   - OAuth flow handling

4. **`packages/cloud/src/config.ts`** (Lines 1-7)
   - Environment configuration
   - Default API endpoints

---

## 🔄 Mode Switching Logic

```typescript
// In CloudService.initialize()
const cloudToken = process.env.ROO_CODE_CLOUD_TOKEN

if (cloudToken && cloudToken.length > 0) {
    // ✅ DEVELOPMENT MODE - Bypass Active
    this._authService = new StaticTokenAuthService(this.context, cloudToken, this.log)
    // Console log: "[auth] Using StaticTokenAuthService"
} else {
    // ✅ PRODUCTION MODE - Normal Auth Flow
    this._authService = new WebAuthService(this.context, this.log)
    // Console log: "[auth] Using WebAuthService"
}
```

---

## 🎯 What Gets Affected

### Behavior Changes

| Method/Feature | Production Mode | Development Bypass |
|---------------|----------------|-------------------|
| `isAuthenticated()` | Dynamic (based on session) | ✅ Always `true` |
| `hasActiveSession()` | Dynamic (based on token) | ✅ Always `true` |
| `getState()` | Dynamic states | 🔒 Always `"active-session"` |
| `getUserInfo()` | From Clerk `/me` API | 📦 Parsed from JWT |
| `getSessionToken()` | Refreshed every 50s | 🔒 Static token |
| `login()` | Opens browser OAuth | ❌ Throws error |
| `logout()` | Clears session | ❌ Throws error |
| `switchOrganization()` | Switches org context | ❌ Throws error |
| `getOrganizationMemberships()` | Fetches from API | ❌ Throws error |

### UI/UX Changes

- **Login Screen**: Not shown (automatically authenticated)
- **Cloud Button**: User appears logged in immediately
- **Organization Switcher**: Not available in bypass mode
- **Session Expiry**: No automatic refresh or expiry warnings

---

## 🧪 JWT Token Structure

The bypass mode expects JWT tokens with this payload:

```json
{
  "iss": "rcc",
  "sub": "job_id_or_user_id",
  "exp": 1756279754,
  "iat": 1756275854,
  "nbf": 1756275824,
  "v": 1,
  "r": {
    "u": "user_YOUR_USER_ID",        // ✅ REQUIRED: User identifier
    "o": "org_YOUR_ORG_ID",          // ⚠️ OPTIONAL: Organization identifier
    "t": "auth" | "cj"               // Token type
  }
}
```

### User Info Extraction

```typescript
// From StaticTokenAuthService constructor
const payload = jwtDecode<JWTPayload>(token)

this.userInfo = {
    id: payload?.r?.u || payload?.sub || undefined,
    organizationId: payload?.r?.o || undefined,
    extensionBridgeEnabled: true  // Always enabled in bypass mode
}
```

---

## 🚀 Usage Examples

### Example 1: Personal Account Testing

```bash
# Token without organization
export ROO_CODE_CLOUD_TOKEN="eyJ...personal-token..."
export ROO_CODE_CLOUD_ORG_SETTINGS='{"allowAll":true,"providers":{}}'
./rebuild-and-install.sh
```

**Result**: User authenticated without organization context

### Example 2: Organization Account Testing

```bash
# Token with organization
export ROO_CODE_CLOUD_TOKEN="eyJ...org-token-with-o-field..."
export ROO_CODE_CLOUD_ORG_SETTINGS='{"allowAll":true,"providers":{}}'
./rebuild-and-install.sh
```

**Result**: User authenticated with organization context

### Example 3: Using Helper Script

```bash
# Copy and configure environment
cp .env.development.example .env.development
nano .env.development  # Add your token

# Run automated setup
./scripts/dev-no-auth.sh

# Or pass token directly
./scripts/dev-no-auth.sh "eyJ...your-token..."
```

**Result**: Automated setup with clear status messages

---

## 🔍 Verification Steps

### 1. Check Developer Console

```bash
# After restarting VS Code
# Open: Cmd+Shift+P → "Developer: Toggle Developer Tools"
# Look for: [auth] Using StaticTokenAuthService
```

### 2. Check Environment

```bash
# Verify token is set
echo $ROO_CODE_CLOUD_TOKEN

# Decode token payload (requires Node.js)
node -e "console.log(JSON.parse(Buffer.from('$ROO_CODE_CLOUD_TOKEN'.split('.')[1], 'base64').toString()))"
```

### 3. Test in Extension

```typescript
import { CloudService } from "@roo-code/cloud"

const cloudService = CloudService.instance

console.log("Authenticated:", cloudService.isAuthenticated())  // Should be true
console.log("Has Session:", cloudService.hasActiveSession())   // Should be true
console.log("State:", cloudService.getAuthState())             // Should be "active-session"
console.log("User Info:", cloudService.getUserInfo())          // Should show parsed JWT data
```

---

## ⚠️ Important Notes

### Security Warnings

1. ❌ **Never commit** `.env.development` or tokens to Git
2. ❌ **Never use** bypass mode in production builds
3. ❌ **Never share** tokens between developers
4. ✅ **Always rotate** tokens regularly
5. ✅ **Always verify** `.gitignore` includes `.env*`

### Limitations

1. **Token Lifetime**: Generated tokens expire in 1 hour
2. **No Organization Switching**: Cannot test org switching features
3. **No Login Flow Testing**: Cannot test actual OAuth flow
4. **No Session Refresh**: Cannot test session expiry handling
5. **Static User Info**: User info doesn't update from API

### When to Use

✅ **Use bypass for:**
- Local development
- Automated testing
- Feature development
- Quick prototyping
- Offline testing

❌ **Don't use bypass for:**
- Production builds
- Auth flow testing
- Session management testing
- Organization switching testing
- Security testing

---

## 📚 Documentation Reference

| Document | Purpose | Location |
|----------|---------|----------|
| **Complete Guide** | Full implementation details | `DEVELOPMENT_AUTH_BYPASS.md` |
| **Quick Reference** | Cheat sheet and examples | `docs/AUTH_BYPASS_QUICK_REF.md` |
| **This Summary** | Overview and key points | `SUMMARY_AUTH_BYPASS.md` |
| **Environment Template** | Configuration template | `.env.development.example` |
| **Setup Script** | Automated bypass setup | `scripts/dev-no-auth.sh` |

---

## 🔄 Switching Between Modes

### Enable Bypass (Development)

```bash
export ROO_CODE_CLOUD_TOKEN="your-token"
./rebuild-and-install.sh
```

### Disable Bypass (Production)

```bash
unset ROO_CODE_CLOUD_TOKEN
unset ROO_CODE_CLOUD_ORG_SETTINGS
./rebuild-and-install.sh
```

---

## 🛠️ Generate Development Token

```bash
# Using the CLI tool
pnpm --filter @roo-code-cloud/roomote-cli development auth job-token \
  --job-id 1 \
  --user-id user_YOUR_USER_ID \
  --org-id org_YOUR_ORG_ID

# Token will be valid for 1 hour
```

---

## 📞 Troubleshooting

### Problem: Extension still asks for login

**Solution:**
```bash
# 1. Verify token is set
echo $ROO_CODE_CLOUD_TOKEN

# 2. Restart VS Code completely
# Quit: Cmd+Q (not just close window)

# 3. Check developer console for auth service type
# Should see: [auth] Using StaticTokenAuthService

# 4. If still not working, rebuild
./rebuild-and-install.sh
```

### Problem: Token expired

**Solution:**
```bash
# Generate new token
pnpm --filter @roo-code-cloud/roomote-cli development auth job-token \
  --job-id 1 \
  --user-id user_YOUR_USER_ID \
  --org-id org_YOUR_ORG_ID

# Update environment variable
export ROO_CODE_CLOUD_TOKEN="new-token-here"

# Rebuild
./rebuild-and-install.sh
```

### Problem: Organization features not working

**Solution:**
```bash
# Ensure token has organization ID in payload
# Check payload:
node -e "console.log(JSON.parse(Buffer.from('$ROO_CODE_CLOUD_TOKEN'.split('.')[1], 'base64').toString()))"

# Look for: { "r": { "o": "org_..." } }

# Also set organization settings:
export ROO_CODE_CLOUD_ORG_SETTINGS='{"allowAll":true,"providers":{}}'

# Rebuild
./rebuild-and-install.sh
```

---

## ✅ Summary Checklist

- [x] Comprehensive documentation created
- [x] Quick reference guide available  
- [x] Environment template provided
- [x] Automated setup script created
- [x] All code files identified and documented
- [x] Security warnings included
- [x] Troubleshooting guide provided
- [x] Examples and use cases documented
- [x] Mode switching explained
- [x] Verification steps outlined

---

**Version**: 1.0.1  
**Last Updated**: 2025-01-09  
**Maintainer**: NoCodr Development Team
