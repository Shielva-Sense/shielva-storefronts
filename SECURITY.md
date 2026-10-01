# Security policy

Report vulnerabilities to **security@shielva.com**. We acknowledge within 2 business days and ship
fixes for critical issues within 30 days. Please don't open public issues for security reports.

Security-sensitive areas (label PRs **Sensitive**, Security Owner review required): `src/lib/crypto.ts`,
`src/lib/sessions.ts`, `src/plugins/{security,audit,tenancy}.ts`, `src/shopify/hmac.ts`,
`src/modules/webhooks/*`, `src/modules/admin/auth.ts`.

Secrets: `MASTER_KEY`, `JWT_SECRET`, `AUDIT_HMAC_SECRET` and Shopify credentials must be delivered via
the vault sealed-config blob in production — never as plaintext env files. Shopify tokens are stored
AES-256-GCM sealed (per-tenant context) and decrypted only in memory.
