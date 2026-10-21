# Makron.js npm Release & Publishing Guide

This guide details the complete, verified release checklist and publication process for `makron.js`.

---

## 1. Pre-Release Verification Pipeline

Run the full automated release readiness suite before tagging or publishing:

```bash
# 1. Run all logic and provider unit tests
npm run test

# 2. Run TypeScript static typecheck
npm run lint

# 3. Validate bundled model catalog records and source URLs
npm run models:validate

# 4. Verify subpath package exports
npm run check:exports

# 5. Build dual ESM / CommonJS bundles and TypeScript declaration files
npm run build:package

# 6. Run comprehensive release readiness gate
npm run release:check

# 7. Inspect final tarball contents (dry-run)
npm pack --dry-run
```

---

## 2. Package Name & Registry Availability

Before publishing the first version:

1. Verify authenticated user:
   ```bash
   npm whoami
   ```
2. Check package name registration status:
   ```bash
   npm view makron.js
   ```
   *Note: If `makron.js` is taken on the public npm registry, publish under the scoped identifier `@makron-ai/core` or `@makron/sdk` without modifying repository code.*

---

## 3. Step-by-Step Publishing Checklist

1. **Clean Workspace**: Ensure git working tree is clean and synced with `main`.
2. **Version Bump**: Bump `version` in `package.json` following semantic versioning (`v0.1.0` -> `v0.1.1` for patches, `v0.2.0` for features).
3. **Changelog Update**: Add release notes to `CHANGELOG.md`.
4. **Git Tagging**:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
5. **Two-Factor Authentication**:
   Ensure 2FA is active on your npm account.
6. **Publishing**:
   ```bash
   npm publish --access public --provenance
   ```
7. **Verification**:
   Install the published package in a clean test directory:
   ```bash
   mkdir /tmp/makron-test && cd /tmp/makron-test
   npm init -y
   npm install makron.js
   node -e "const { createMakron } = require('makron.js'); console.log(typeof createMakron);"
   ```

---

## 4. GitHub Actions Trusted Publishing (OIDC)

When publishing via GitHub Actions CI/CD (`.github/workflows/release.yml`), prefer npm Trusted Publishing via OpenID Connect (OIDC) rather than storing long-lived personal tokens:

```yaml
permissions:
  id-token: write
  contents: read

steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with:
      node-version: 22
      registry-url: 'https://registry.npmjs.org'
  - run: npm ci
  - run: npm run test
  - run: npm run build:package
  - run: npm publish --access public --provenance
    env:
      NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
