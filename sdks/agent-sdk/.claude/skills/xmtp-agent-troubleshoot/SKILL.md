---
name: xmtp-agent-troubleshoot
description: Troubleshooting knowledge for XMTP agent development. Use when a developer encounters errors like "transport error", "GenericFailure", "PRAGMA key", "hex format", installation warnings, or any XMTP agent crash or connectivity issue.
user-invocable: false
---

# XMTP Agent Troubleshooting Knowledge

## Error: `[Error: transport error] { code: 'GenericFailure' }`

This is the most common deployment error. Two possible causes:

### Cause 1: Missing CA certificates in Docker (most likely)

The `node:22-slim` Docker image does not include CA certificates. The XMTP native gRPC client needs them for TLS connections.

**Fix:** Add to Dockerfile before any other commands:
```dockerfile
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
```

### How to verify

- If the error happens immediately or within seconds → almost certainly CA certificates
- If it works locally but not in Docker/cloud → almost certainly CA certificates (local machines have CA certs pre-installed)
- Adding `ca-certificates` to the Dockerfile fixes this in nearly all cases

---

## Error: `AgentError: XMTP_WALLET_KEY env is not in hex (0x) format`

`Agent.createFromEnv()` requires the wallet key to have the `0x` prefix.

**Fix:** Ensure the environment variable starts with `0x`:
```
XMTP_WALLET_KEY=0xabc123...  # correct
XMTP_WALLET_KEY=abc123...    # will throw this error
```

This applies to both local `.env` files and cloud environment variables (Railway, Fly.io, etc.).

---

## Error: `PRAGMA key or salt has incorrect value`

The database encryption key changed between runs, and the existing database file was encrypted with a different key.

**Fix options:**
1. Use the same `XMTP_DB_ENCRYPTION_KEY` value consistently
2. Delete all `xmtp-*.db3*` files and start fresh (message history is on the network, not just local)

---

## Error: `Failed to create reference from TypedArray`

The `dbEncryptionKey` was passed in the wrong format to `Client.create()`.

**Fix:** Use `Agent.createFromEnv()` instead of manually calling `Agent.create()`. It handles all key format normalization automatically. If you must use `Agent.create()` directly, pass `dbEncryptionKey` as a hex string (with or without `0x` prefix), not a `Uint8Array` or `Buffer`.

---

## Error: `invalid private key, expected hex or 32 bytes, got string`

The wallet key passed to `createUser()` is not in the correct format.

**Fix:** Ensure the key is a hex string with `0x` prefix:
```typescript
const user = createUser("0xabc123..." as `0x${string}`);
```

Or use `Agent.createFromEnv()` which handles this automatically.

---

## Warning: `You have "N" installations`

Each time you create a new XMTP client without reusing an existing database, a new installation is created. The limit is **10 installations per inbox**.

**Causes:**
- Deploying without persistent storage (each deploy = new installation)
- Deleting database files between runs
- Running the agent in multiple environments without separate wallets

**Fix:**
- Set `XMTP_DB_DIRECTORY` to a persistent path
- On Railway: data persists by default
- On Fly.io: create a mounted volume and set `XMTP_DB_DIRECTORY` to the mount path
- On Docker: mount a host volume for the database directory
- Use separate wallet keys for dev vs production

If you've already exceeded the limit, you need to revoke old installations using `Client.revokeInstallations()`.

---

## Old database files from SDK v1.x

If upgrading from `@xmtp/agent-sdk` v1.x (or `@xmtp/node-sdk` v1.x) to v2.x, old database files are incompatible.

**Symptoms:** Various errors during client creation or message streaming.

**Fix:** Delete all `xmtp-*.db3*` files (including `.db3-shm`, `.db3-wal`, `.db3.sqlcipher_salt`):
```bash
rm -f xmtp-*.db3*
```

Message history is stored on the XMTP network, not just locally. You won't lose messages.

---

## Self-messages / Infinite loops

The XMTP Agent SDK (`Agent` class) automatically filters out messages sent by the agent itself. If you're using the raw `@xmtp/node-sdk` `Client` directly, you must filter manually:

```typescript
if (message.senderInboxId === client.inboxId) continue;
```

Without this, the agent responds to its own messages, creating an infinite loop.

---

## Agent starts but never receives messages

**Possible causes:**
1. The agent is on a different network than the sender (e.g., agent on `dev`, sender on `production`)
2. The agent's `start()` was never called
3. The wallet key is different from what the sender is messaging

**Fix:** Check the console output for the agent's address and network, then ensure you're messaging that exact address on that exact network via xmtp.chat.

---

## General debugging tips

- Set `XMTP_FORCE_DEBUG_LEVEL=debug` environment variable for verbose logging from the XMTP client
- Use the `logDetails(agent)` helper from `@xmtp/agent-sdk` to print full client info
- Test locally before deploying — most issues are easier to debug locally
- Use `xmtp.chat/dm/<address>` to test messaging your agent
