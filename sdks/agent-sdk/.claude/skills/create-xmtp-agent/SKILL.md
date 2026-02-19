---
name: create-xmtp-agent
description: Scaffold a new XMTP agent project with an AI brain and the XMTP Agent SDK messaging framework. Use when asked to create, scaffold, or start a new XMTP agent.
disable-model-invocation: true
argument-hint: "[brain: claude|openai|rules]"
---

# Create a New XMTP Agent

Scaffold a new XMTP agent project using **$ARGUMENTS** as the brain.

## Architecture

Every XMTP agent has three layers. Follow this pattern exactly:

1. **THE BRAIN** — The AI/logic that decides what to say (Claude API, OpenAI, or rules)
2. **THE MESSAGING FRAMEWORK** — XMTP Agent SDK handles encrypted send/receive
3. **THE GLUE** — Your code wiring messages to the brain and responses back

The XMTP Agent SDK is a messaging framework, not an agent framework. It provides the transport layer. The developer brings the intelligence.

## Project Structure to Create

```
project/
├── src/
│   └── index.ts       # The agent (brain + framework + glue)
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript config
├── .env.example       # Template for environment variables
├── .gitignore         # Ignore .env, node_modules, *.db3*
├── Dockerfile         # For cloud deployment
└── .dockerignore      # Keep images clean
```

## package.json

```json
{
  "name": "my-xmtp-agent",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx --watch src/index.ts",
    "start": "tsx src/index.ts"
  },
  "engines": {
    "node": ">=22"
  }
}
```

Dependencies to install:
- `@xmtp/agent-sdk` — the messaging framework
- `dotenv` — loads .env file
- If brain is `claude`: `@anthropic-ai/sdk`
- If brain is `openai`: `openai`
- If brain is `rules`: no additional dependency

## .env.example

```
XMTP_WALLET_KEY=        # Private key with 0x prefix (REQUIRED)
XMTP_DB_ENCRYPTION_KEY= # 32-byte hex key for local database
XMTP_ENV=dev            # local, dev, or production
XMTP_DB_DIRECTORY=      # Directory for persistent database storage
```

If brain is `claude`, add: `ANTHROPIC_API_KEY=`
If brain is `openai`, add: `OPENAI_API_KEY=`

## src/index.ts — Three-Layer Pattern

### If brain is `claude`:

```typescript
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { Agent, CommandRouter } from "@xmtp/agent-sdk";

// ---------------------------------------------------------------------------
// 1. THE BRAIN — Claude API
// ---------------------------------------------------------------------------

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `[REPLACE: Define your agent's personality and rules here.
This is the only thing that changes between different agents.
The messaging framework and glue code stay the same.]`;

async function think(input: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: input }],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text : "I couldn't generate a response.";
}

// ---------------------------------------------------------------------------
// 2. THE MESSAGING FRAMEWORK — XMTP Agent SDK
// ---------------------------------------------------------------------------

const agent = await Agent.createFromEnv();

const router = new CommandRouter({ helpCommand: "/help" });
router.command("/help", "Show help", async (ctx) => {
  await ctx.conversation.sendText("[REPLACE: Your help message here]");
});

agent.use(router.middleware());

// ---------------------------------------------------------------------------
// 3. THE GLUE — Connect messages to the brain
// ---------------------------------------------------------------------------

agent.on("text", async (ctx) => {
  const input = ctx.message.content;
  const response = await think(input);
  await ctx.conversation.sendText(response);
});

agent.on("start", () => {
  console.log(`Agent online: ${agent.address}`);
  console.log(`Chat: http://xmtp.chat/dm/${agent.address}`);
});

agent.on("unhandledError", (error) => {
  console.error("Error:", error);
});

await agent.start();
```

### If brain is `openai`:

Replace the brain section with:

```typescript
import OpenAI from "openai";

const openai = new OpenAI();

const SYSTEM_PROMPT = `[REPLACE: Your agent's personality]`;

async function think(input: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: input },
    ],
  });
  return response.choices[0]?.message?.content ?? "I couldn't generate a response.";
}
```

### If brain is `rules`:

Replace the brain section with:

```typescript
function think(input: string): string {
  const lower = input.toLowerCase().trim();
  if (lower.startsWith("/")) return `Unknown command: ${lower}`;
  // [REPLACE: Add your rules/logic here]
  return "I received your message.";
}
```

## Dockerfile

CRITICAL: `ca-certificates` is required for gRPC/TLS connections to the XMTP network. Without it, the agent crashes with `[Error: transport error] { code: 'GenericFailure' }`.

```dockerfile
FROM node:22-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* ./
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

## tsconfig.json

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["**/*.ts"]
}
```

## .gitignore

```
node_modules/
*.db3*
.env
```

## Critical Reminders

- XMTP_WALLET_KEY MUST have `0x` prefix
- Use `Agent.createFromEnv()` — it handles key format normalization automatically
- Node.js 22+ is required
- For production visibility (Converse, xmtp.chat), use `XMTP_ENV=production`
- Dockerfile MUST include `ca-certificates`
- Persist the database directory across deploys to avoid burning installations (limit: 10)
