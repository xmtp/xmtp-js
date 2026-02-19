---
name: deploy-xmtp-agent
description: Deploy an XMTP agent to a cloud platform like Railway. Use when asked to deploy, host, or ship an XMTP agent.
disable-model-invocation: true
argument-hint: "[platform: railway]"
---

# Deploy an XMTP Agent

Deploy the current XMTP agent project to **$ARGUMENTS**.

## Pre-Deployment Checklist

Before deploying, verify:

1. The agent runs locally (`npx tsx src/index.ts`)
2. A `Dockerfile` exists (create one if not — see below)
3. A `.dockerignore` exists (to exclude .env, node_modules, *.db3*)
4. The `.env` file has all required variables

## Dockerfile Requirements

CRITICAL: The `ca-certificates` package is required. Without it, gRPC/TLS connections to the XMTP network fail silently with `[Error: transport error] { code: 'GenericFailure' }`.

```dockerfile
FROM node:22-slim

# THIS LINE IS REQUIRED — without it, XMTP gRPC connections fail
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* .yarnrc.yml* ./
COPY .yarn .yarn 2>/dev/null || true
RUN npm install --production 2>/dev/null || yarn install --immutable 2>/dev/null || true

COPY src ./src
COPY tsconfig.json ./

CMD ["npm", "start"]
```

## .dockerignore

```
node_modules
*.db3*
.env
```

## Deploy to Railway

### 1. Install CLI and log in

```bash
npm install -g @railway/cli
railway login
```

### 2. Initialize project

```bash
railway init
```

### 3. Link the service

After `railway up` creates the service, link it:

```bash
railway service link <service-name>
```

### 4. Set environment variables

IMPORTANT: `XMTP_WALLET_KEY` MUST have the `0x` prefix. `createFromEnv()` will throw `AgentError: XMTP_WALLET_KEY env is not in hex (0x) format` without it.

```bash
railway variables set \
  "XMTP_WALLET_KEY=0x..." \
  "XMTP_DB_ENCRYPTION_KEY=0x..." \
  "XMTP_ENV=production" \
  "ANTHROPIC_API_KEY=sk-ant-..."
```

NOTE: Use `XMTP_ENV=production` when you're ready for your agent to be reachable from production XMTP apps (Converse, xmtp.chat, etc.). The `dev` network works for testing but is a separate network.

### 5. Deploy

```bash
railway up
```

### 6. Check logs

```bash
railway service logs
```

You should see:
```
Agent online: 0x...
Chat: http://xmtp.chat/dm/0x...
```

## Persistent Storage Warning

Every deployment that creates a new XMTP installation counts against a limit of **10 installations per inbox**. Exceeding this limit breaks the agent.

- **Railway**: Data persists across redeploys by default (good)
- **Fly.io**: You MUST create a mounted volume and set `XMTP_DB_DIRECTORY` to the mount path
- **Docker (generic)**: Mount a host volume to persist the database directory

If you see warnings like `You have "N" installations`, your database is not persisting across deploys.

## Troubleshooting Deployment

| Symptom | Cause | Fix |
|---|---|---|
| `transport error` / `GenericFailure` | Missing `ca-certificates` in Docker | Add `RUN apt-get update && apt-get install -y ca-certificates` to Dockerfile |
| `XMTP_WALLET_KEY env is not in hex (0x) format` | Wallet key missing `0x` prefix | Add `0x` prefix to the key in environment variables |
| `PRAGMA key or salt has incorrect value` | Encryption key changed between runs | Use the same `XMTP_DB_ENCRYPTION_KEY` consistently, or delete old `.db3` files |
| Agent works locally but not in cloud | Missing CA certificates in Docker | Add `ca-certificates` to Dockerfile (local machines have certs pre-installed) |
| `You have "N" installations` warning | Database not persisting across deploys | Configure persistent storage for the database directory |
