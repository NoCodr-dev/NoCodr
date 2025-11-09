# 📚 Authentication Bypass Documentation Index

Complete guide to bypassing authentication in NoCodr extension for development and testing.

---

## 🚀 Quick Navigation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[SUMMARY_AUTH_BYPASS.md](./SUMMARY_AUTH_BYPASS.md)** | Complete overview | Start here first |
| **[docs/DEVELOPMENT_SETUP.md](./docs/DEVELOPMENT_SETUP.md)** | Setup guide | Setting up dev environment |
| **[docs/AUTH_BYPASS_QUICK_REF.md](./docs/AUTH_BYPASS_QUICK_REF.md)** | Quick reference | Need quick answers |
| **[DEVELOPMENT_AUTH_BYPASS.md](./DEVELOPMENT_AUTH_BYPASS.md)** | Full details | Deep dive into implementation |

---

## 🛠️ Tools & Configuration

| File | Purpose | Usage |
|------|---------|-------|
| **[.env.development.example](./.env.development.example)** | Template | Copy to `.env.development` |
| **[scripts/dev-no-auth.sh](./scripts/dev-no-auth.sh)** | Setup script | Run to enable bypass |
| **[rebuild-and-install.sh](./rebuild-and-install.sh)** | Build script | Standard build process |

---

## 📖 Documentation Structure

```
Authentication Bypass Documentation
│
├── 🎯 SUMMARY_AUTH_BYPASS.md
│   ├── Overview of bypass mechanism
│   ├── Affected code files (with line numbers)
│   ├── Environment variables
│   ├── Quick start examples
│   ├── JWT token structure
│   └── Troubleshooting guide
│
├── 📘 DEVELOPMENT_AUTH_BYPASS.md
│   ├── Complete implementation details
│   ├── How it works (code flow)
│   ├── Configuration defaults
│   ├── Usage examples (3 scenarios)
│   ├── Token generation instructions
│   ├── Testing scenarios
│   └── Security notes
│
├── 📗 docs/AUTH_BYPASS_QUICK_REF.md
│   ├── Quick start (TL;DR)
│   ├── What changes (comparison table)
│   ├── Environment variables reference
│   ├── Affected files table
│   ├── Testing scenarios
│   ├── Verification steps
│   ├── JWT token structure
│   └── Troubleshooting tips
│
└── 📙 docs/DEVELOPMENT_SETUP.md
    ├── Complete development setup
    ├── Prerequisites
    ├── Standard vs bypass workflow
    ├── Environment variables
    ├── Mode comparison
    ├── Project structure
    └── Security notes
```

---

## 🔑 Core Concepts

### Environment Variable

```bash
export ROO_CODE_CLOUD_TOKEN="your-jwt-token-here"
```

### Affected Files

1. **`packages/cloud/src/CloudService.ts`** (Lines 107-122)
   - Mode selection logic

2. **`packages/cloud/src/StaticTokenAuthService.ts`** (Full file)
   - Development bypass implementation

3. **`packages/cloud/src/WebAuthService.ts`** (Full file)
   - Production authentication

4. **`packages/cloud/src/config.ts`** (Lines 1-7)
   - API endpoint configuration

### What Changes

| Component | Production | Development |
|-----------|-----------|-------------|
| Auth Service | WebAuthService | StaticTokenAuthService |
| Login Required | ✅ Yes | ❌ No |
| isAuthenticated() | Dynamic | ✅ Always true |
| hasActiveSession() | Dynamic | ✅ Always true |

---

## ⚡ Quick Start

### Method 1: Helper Script (Recommended)

```bash
# 1. Create environment file
cp .env.development.example .env.development

# 2. Edit and add your token
nano .env.development

# 3. Run setup script
./scripts/dev-no-auth.sh

# 4. Restart VS Code
```

### Method 2: Manual Setup

```bash
# 1. Set environment variable
export ROO_CODE_CLOUD_TOKEN="your-jwt-token"

# 2. Build and install
./rebuild-and-install.sh

# 3. Restart VS Code
```

---

## 🔍 Verification

### Check Mode in Developer Console

```
Production Mode: [auth] Using WebAuthService
Development Mode: [auth] Using StaticTokenAuthService
```

### Verify Environment

```bash
# Check token is set
echo $ROO_CODE_CLOUD_TOKEN

# Decode token payload
node -e "console.log(JSON.parse(Buffer.from('$ROO_CODE_CLOUD_TOKEN'.split('.')[1], 'base64').toString()))"
```

---

## 📝 Token Generation

```bash
pnpm --filter @roo-code-cloud/roomote-cli development auth job-token \
  --job-id 1 \
  --user-id user_YOUR_USER_ID \
  --org-id org_YOUR_ORG_ID
```

**Note**: Token expires in 1 hour

---

## 🎓 Learning Path

### Beginner

1. **Start**: Read [SUMMARY_AUTH_BYPASS.md](./SUMMARY_AUTH_BYPASS.md)
2. **Setup**: Follow [docs/DEVELOPMENT_SETUP.md](./docs/DEVELOPMENT_SETUP.md)
3. **Try**: Use [scripts/dev-no-auth.sh](./scripts/dev-no-auth.sh)

### Intermediate

1. **Reference**: Use [docs/AUTH_BYPASS_QUICK_REF.md](./docs/AUTH_BYPASS_QUICK_REF.md)
2. **Customize**: Edit [.env.development.example](./.env.development.example)
3. **Test**: Try different scenarios from quick ref

### Advanced

1. **Deep Dive**: Read [DEVELOPMENT_AUTH_BYPASS.md](./DEVELOPMENT_AUTH_BYPASS.md)
2. **Code Review**: Examine affected files listed
3. **Extend**: Modify authentication flow for your needs

---

## 🔧 Common Tasks

### Enable Bypass

```bash
export ROO_CODE_CLOUD_TOKEN="your-token"
./rebuild-and-install.sh
```

### Disable Bypass

```bash
unset ROO_CODE_CLOUD_TOKEN
./rebuild-and-install.sh
```

### Generate New Token

```bash
pnpm --filter @roo-code-cloud/roomote-cli development auth job-token \
  --job-id 1 --user-id user_ID --org-id org_ID
```

### Check Current Mode

```bash
# Check environment
echo $ROO_CODE_CLOUD_TOKEN

# Check in VS Code
# Open Developer Tools → Console
# Look for auth service type
```

---

## ⚠️ Important Notes

### Security

- ❌ Never commit tokens to Git
- ❌ Never use bypass in production
- ✅ Rotate tokens regularly
- ✅ Keep tokens in `.env.development` (gitignored)

### Limitations

- Token expires in 1 hour
- Cannot test organization switching
- Cannot test login flow
- Cannot test session refresh

### Best Practices

- Use bypass for local development only
- Generate separate tokens per developer
- Document token usage in your team
- Always verify mode before testing

---

## 📞 Support & Troubleshooting

### Common Issues

| Issue | Solution | Reference |
|-------|----------|-----------|
| Still asks for login | Verify token is set before VS Code starts | Quick Ref → Troubleshooting |
| Token expired | Generate new token | Summary → Token Generation |
| Features not working | Check JWT payload structure | Details → JWT Structure |
| Build errors | Clean and rebuild | Setup → Troubleshooting |

### Where to Look

1. **Quick answers**: [docs/AUTH_BYPASS_QUICK_REF.md](./docs/AUTH_BYPASS_QUICK_REF.md)
2. **Step-by-step**: [docs/DEVELOPMENT_SETUP.md](./docs/DEVELOPMENT_SETUP.md)
3. **Deep issues**: [DEVELOPMENT_AUTH_BYPASS.md](./DEVELOPMENT_AUTH_BYPASS.md)

---

## 📊 Document Sizes

| Document | Size | Lines | Reading Time |
|----------|------|-------|--------------|
| SUMMARY_AUTH_BYPASS.md | 9.8 KB | 392 | 8-10 min |
| DEVELOPMENT_AUTH_BYPASS.md | 8.0 KB | 312 | 6-8 min |
| docs/AUTH_BYPASS_QUICK_REF.md | 7.1 KB | 284 | 5-7 min |
| docs/DEVELOPMENT_SETUP.md | 9.5 KB | 380 | 8-10 min |
| .env.development.example | 2.0 KB | 59 | 2-3 min |
| scripts/dev-no-auth.sh | 7.1 KB | 181 | 4-5 min |

**Total Documentation**: ~43.5 KB | ~1,608 lines

---

## 🗺️ Related Documentation

- [Main README](./README.md)
- [CHANGELOG](./CHANGELOG.md)
- [DEVELOPMENT](./DEVELOPMENT.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

---

## 📅 Version Info

- **Created**: 2025-01-09
- **Version**: 1.0.1
- **Last Updated**: 2025-01-09
- **Maintained by**: NoCodr Development Team

---

## ✅ Documentation Checklist

- [x] Quick start guide
- [x] Complete implementation details
- [x] Quick reference card
- [x] Development setup guide
- [x] Environment template
- [x] Automated setup script
- [x] Security warnings
- [x] Troubleshooting guide
- [x] Code file references
- [x] Example scenarios
- [x] Verification steps
- [x] This index document

---

**Happy Developing! 🚀**
