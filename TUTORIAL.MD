# Building a Magic 8 Ball agent with XMTP and Claude

This tutorial walks through building an AI-powered Magic 8 Ball agent that anyone can message from any XMTP-compatible app. The agent uses the XMTP Agent SDK to send and receive private, secure messages using the XMTP network and the Anthropic SDK as its "brain."

By the end, you will have a working agent deployed to the cloud that responds to yes/no questions with classic Magic 8 Ball answers, powered by Claude.

## Three-layer architecture

Every agent built on XMTP has the same basic structure:

1. **The brain** is whatever logic decides what your agent says. Here, it is Claude with a Magic 8 Ball persona. It could just as easily be OpenAI, a rules engine, or a trading algorithm. The brain doesn't need to know anything about messaging.

2. **The messaging framework** is provided by the XMTP Agent SDK. It connects to the XMTP network, receives encrypted messages, and sends encrypted replies. It knows nothing about AI.

3. **The glue** is the small amount of code you write to connect the brain and the messaging framework: Take an incoming message, pass it to the brain, and send the brain's response back through XMTP, the messaging framework.

This separation matters because swapping the brain (say, from a Magic 8 Ball to a customer service agent) does not require changing the messaging layer, and vice versa.

```
┌─────────────────────────────────────────────────┐
│                  YOUR AGENT                     │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │           1. THE BRAIN                    │  │
│  │    Claude API + system prompt             │  │
│  │    (decides what to say)                  │  │
│  └──────────────────┬────────────────────────┘  │
│                     │                           │
│  ┌──────────────────▼────────────────────────┐  │
│  │           3. THE GLUE                     │  │
│  │    a. Get message from XMTP               │  │
│  │    b. Send message to brain               │  │
│  │    c. Get response from brain             │  │
│  │    d. Send response back to XMTP          │  │
│  └──────────────────┬────────────────────────┘  │
│                     │                           │
│  ┌──────────────────▼────────────────────────┐  │
│  │     2. THE MESSAGING FRAMEWORK            │  │
│  │    XMTP Agent SDK                         │  │
│  │    (encrypted send/receive over XMTP)     │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Prerequisites

- **Node.js 22+** (required by the XMTP Agent SDK)
- **An Anthropic API key** from [console.anthropic.com](https://console.anthropic.com)
- **Basic TypeScript knowledge** (we will explain the XMTP-specific parts)
- **An Ethereum wallet private key** (any hex private key works. the agent needs an identity on the network)

## Step 1: Scaffold the project

Create a new directory and initialize the project:

```bash
mkdir magic-8-ball-bot
cd magic-8-ball-bot
git init
```

Create `package.json`. Two fields to note:

- `"type": "module"`: Tells Node.js to treat files as ES modules so `import`/`export` syntax works. Without it, Node defaults to CommonJS (`require`/`module.exports`) and the Agent SDK won't load.
- `"engines": { "node": ">=22" }`: The Agent SDK depends on Node 22+ features.

```json
{
  "name": "magic-8-ball-bot",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsx --watch src/index.ts",
    "start": "tsx src/index.ts",
    "typecheck": "tsc"
  },
  "engines": {
    "node": ">=22"
  }
}
```

Install the dependencies:

```bash
# Runtime dependencies
yarn add @xmtp/agent-sdk @anthropic-ai/sdk dotenv

# Dev tools (not needed at runtime)
yarn add -D typescript tsx @types/node
```

- `@xmtp/agent-sdk`: Provides the messaging framework
- `@anthropic-ai/sdk`: Provides the brain
- `dotenv`: Loads environment variables from a `.env` file
- `tsx`: Runs TypeScript files directly

Create `tsconfig.json`:

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

Now create the `.env` file. This holds the secrets the agent needs at runtime:

```bash
# .env
XMTP_WALLET_KEY=0x...         # Your agent's Ethereum private key (must have 0x prefix)
XMTP_DB_ENCRYPTION_KEY=...    # A 32-byte hex key for encrypting the local database
XMTP_ENV=dev                  # dev, production, or local
ANTHROPIC_API_KEY=sk-ant-...  # Your Claude API key
```

Make sure `.env` is in your `.gitignore` so you don't accidentally commit secrets.

Finally, create the source directory:

```bash
mkdir src
```

## Step 2: Build the brain

Open `src/index.ts` and start with the brain. This first section has nothing to do with XMTP. It is pure AI logic.

```typescript
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// 1. THE BRAIN -- Claude API with a Magic 8 Ball persona
// ---------------------------------------------------------------------------

const anthropic = new Anthropic();
```

The Anthropic SDK reads `ANTHROPIC_API_KEY` from the environment automatically. No configuration needed.

Next, define the system prompt. This is the personality file for your agent. Everything about how your agent behaves is controlled here:

```typescript
const SYSTEM_PROMPT = `You are the Mysterious Magic 8 Ball. You must respond with ONLY one of these 20 official answers, nothing else:

It is certain. / It is decidedly so. / Without a doubt. / Yes - definitely. / You may rely on it. / As I see it, yes. / Most likely. / Outlook good. / Yes. / Signs point to yes. / Reply hazy, try again. / Ask again later. / Better not tell you now. / Cannot predict now. / Concentrate and ask again. / Don't count on it. / My reply is no. / My sources say no. / Outlook not so good. / Very doubtful.

If the message is not a yes/no question, respond with: "The spirits require a yes or no question."
Never add any other text. Just the answer, nothing else.`;
```

The system prompt is the most important part of the agent's identity. Want a customer service bot instead of a Magic 8 Ball? Change the system prompt. The rest of the code stays the same.

Now write the function that sends a question to Claude and gets back an answer:

```typescript
async function askTheBall(question: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 150,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: question }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text : "The spirits are silent...";
}
```

That is the entire brain. It takes a question string, sends it to Claude with the Magic 8 Ball persona, and returns the response. If something unexpected happens with the response format, we return a fallback message.

## Step 3: Set up the messaging framework

Now add the XMTP layer. This section has nothing to do with AI. It is pure messaging infrastructure.

```typescript
import { Agent, CommandRouter } from "@xmtp/agent-sdk";

// ---------------------------------------------------------------------------
// 2. THE MESSAGING FRAMEWORK -- XMTP Agent SDK
// ---------------------------------------------------------------------------

// createFromEnv() reads XMTP_WALLET_KEY, XMTP_DB_ENCRYPTION_KEY, and XMTP_ENV
// from process.env and handles all key format normalization automatically.
const agent = await Agent.createFromEnv();
```

That single line does a lot of work:

- Reads `XMTP_WALLET_KEY` from the environment and normalizes the hex format
- Reads `XMTP_DB_ENCRYPTION_KEY` for local database encryption
- Reads `XMTP_ENV` to know which XMTP network to connect to
- Creates the local database directory if needed
- Sets up the XMTP client with proper authentication

Next, set up a command router. This is middleware that intercepts messages starting with `/` and handles them before they reach your main message handler:

```typescript
const router = new CommandRouter({ helpCommand: "/help" });

router.command("/help", "Show help message", async (ctx) => {
  await ctx.conversation.sendText(
    `🔮 Magic 8 Ball 🔮

Ask me a yes/no question and I will consult the spirits.

Commands:
  /help — this message

Powered by XMTP + Claude`,
  );
});

agent.use(router.middleware());
```

The `CommandRouter` is optional but useful. It gives your agent slash commands with automatic help text generation. When someone sends `/help`, the router handles it directly. All other messages pass through to the next handler.

## Step 4: Wire them together (the glue)

This is the smallest section, and that is the point. When the brain and messaging framework are properly separated, the glue is trivial:

```typescript
// ---------------------------------------------------------------------------
// 3. THE GLUE -- Connect incoming messages to the brain, send responses back
// ---------------------------------------------------------------------------

agent.on("text", async (ctx) => {
  const question = ctx.message.content;
  console.log(`Question: "${question}"`);

  const answer = await askTheBall(question);
  console.log(`Answer: "${answer}"`);

  await ctx.conversation.sendText(`🔮 ${answer}`);
});
```

Three lines of actual logic:

1. Get the incoming message from the messaging framework via `ctx.message.content`
2. Pass it to the brain via `askTheBall()`
3. Send the brain's response back through the messaging framework via `ctx.conversation.sendText()`

The `agent.on("text", ...)` handler fires for every incoming text message. The messaging framework handles several things automatically so you don't have to:

- **Self-message filtering**: The agent will not respond to its own messages
- **Content type routing**: `"text"` only fires for text messages, not reactions or other types
- **Conversation lookup**: `ctx.conversation` is already resolved and ready to use
- **Decryption**: Messages arrive already decrypted

Finally, add event handlers for lifecycle events and start the agent:

```typescript
agent.on("start", () => {
  console.log(`🔮 Magic 8 Ball is online`);
  console.log(`   Address: ${agent.address}`);
  console.log(`   Chat: http://xmtp.chat/dm/${agent.address}`);
});

agent.on("unhandledError", (error) => {
  console.error("Error:", error);
});

await agent.start();
```

The `"start"` event fires once the agent is connected and listening. We log the agent's address and a direct link to chat with it. The `"unhandledError"` event catches any errors that are not handled elsewhere.

## The complete file

Here is the entire `src/index.ts`, about 80 lines for a fully functional agent:

```typescript
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { Agent, CommandRouter } from "@xmtp/agent-sdk";

// ---------------------------------------------------------------------------
// 1. THE BRAIN — Claude API with a Magic 8 Ball persona
// ---------------------------------------------------------------------------

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are the Mysterious Magic 8 Ball. You must respond with ONLY one of these 20 official answers, nothing else:

It is certain. / It is decidedly so. / Without a doubt. / Yes - definitely. / You may rely on it. / As I see it, yes. / Most likely. / Outlook good. / Yes. / Signs point to yes. / Reply hazy, try again. / Ask again later. / Better not tell you now. / Cannot predict now. / Concentrate and ask again. / Don't count on it. / My reply is no. / My sources say no. / Outlook not so good. / Very doubtful.

If the message is not a yes/no question, respond with: "The spirits require a yes or no question."
Never add any other text. Just the answer, nothing else.`;

async function askTheBall(question: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 150,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: question }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text : "The spirits are silent...";
}

// ---------------------------------------------------------------------------
// 2. THE MESSAGING FRAMEWORK — XMTP Agent SDK
// ---------------------------------------------------------------------------

const agent = await Agent.createFromEnv();

const router = new CommandRouter({ helpCommand: "/help" });

router.command("/help", "Show help message", async (ctx) => {
  await ctx.conversation.sendText(
    `🔮 Magic 8 Ball 🔮

Ask me a yes/no question and I will consult the spirits.

Commands:
  /help — this message

Powered by XMTP + Claude`,
  );
});

agent.use(router.middleware());

// ---------------------------------------------------------------------------
// 3. THE GLUE — Connect incoming messages to the brain, send responses back
// ---------------------------------------------------------------------------

agent.on("text", async (ctx) => {
  const question = ctx.message.content;
  console.log(`Question: "${question}"`);

  const answer = await askTheBall(question);
  console.log(`Answer: "${answer}"`);

  await ctx.conversation.sendText(`🔮 ${answer}`);
});

agent.on("start", () => {
  console.log(`🔮 Magic 8 Ball is online`);
  console.log(`   Address: ${agent.address}`);
  console.log(`   Chat: http://xmtp.chat/dm/${agent.address}`);
});

agent.on("unhandledError", (error) => {
  console.error("Error:", error);
});

await agent.start();
```

## Step 5: Test locally

Start the agent:

```bash
npx tsx src/index.ts
```

You should see output like:

```
🔮 Magic 8 Ball is online
   Address: 0x1234...abcd
   Chat: http://xmtp.chat/dm/0x1234...abcd
```

Open the chat link in your browser (or use any XMTP-compatible app) and send a question like "Will it rain tomorrow?" You should get back one of the 20 classic Magic 8 Ball responses.

Try sending `/help` to test the command router. Try sending something that is not a question, like "hello." The agent should ask for a yes/no question.

During development, you can use watch mode to auto-restart on changes:

```bash
yarn dev
```

## Step 6: Deploy to Railway

The agent is a long-running process (not a web server), so we need a platform that supports worker services. Railway is just one of the services tht works well for this.

### Create the Dockerfile

```dockerfile
FROM node:22-slim

# Install CA certificates for TLS/gRPC connections
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Enable Corepack for Yarn 4
RUN corepack enable && corepack prepare yarn@4.6.0 --activate

# Copy package files and install dependencies
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN yarn install --immutable

# Copy source
COPY src ./src
COPY tsconfig.json ./

# The agent is a long-running process, not a web server
CMD ["yarn", "start"]
```

The `ca-certificates` line is critical. See the troubleshooting section below for why.

### Create .dockerignore

Keep the Docker build context clean:

```
node_modules
*.db3*
old_db_backup
.env
```

### Create railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile",
    "buildCommand": null
  },
  "deploy": {
    "startCommand": null,
    "healthcheckPath": null,
    "healthcheckTimeout": null,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Deploy

```bash
# Install Railway CLI if you haven't
npm install -g @railway/cli

# Log in and initialize
railway login
railway init

# Set the environment variables
railway variables set XMTP_WALLET_KEY=0x...
railway variables set XMTP_DB_ENCRYPTION_KEY=...
railway variables set XMTP_ENV=production
railway variables set ANTHROPIC_API_KEY=sk-ant-...

# Deploy
railway up
```

NOTE: Use `XMTP_ENV=production` when you want the agent to be reachable from production XMTP apps (xmtp.chat, etc.). The `dev` network is a separate network for testing.

Railway preserves the filesystem across redeploys by default, which means the XMTP database persists. This is important. See the troubleshooting section on persistent storage.

## Tips and troubleshooting

These are based on real issues encountered while building and deploying this agent.

### 1. Wallet key must have 0x prefix

`Agent.createFromEnv()` requires the wallet private key in hex format with the `0x` prefix. Without it, you will see:

```text
AgentError: XMTP_WALLET_KEY env is not in hex (0x) format
```

Make sure the `XMTP_WALLET_KEY` looks like `0xabc123...`, not just `abc123...`.

### 2. Use createFromEnv(), not manual setup

The `Agent.createFromEnv()` factory method handles several things you would otherwise need to do yourself:

- Key format normalization (hex parsing, `0x` prefix handling)
- Encryption key parsing from environment variables
- Environment variable reading with proper defaults
- Database directory creation

Do not manually wire `Agent.create()` unless you have a specific reason. `createFromEnv()` is the happy path.

### 3. Delete old database files when upgrading SDK versions

If you upgrade from one major version of `@xmtp/agent-sdk` to another (e.g., v1.x to v2.x), the local database format may be incompatible. You will get errors on startup.

The fix: delete all `xmtp-*.db3*` files and start fresh:

```bash
rm -f xmtp-*.db3*
```

You won't lose messages — message history lives on the XMTP network and will sync back down. However, deleting the database forces a new XMTP installation, which counts against the limit of 10 per inbox (see tips 6 and 7). Only delete when necessary, like after a major SDK upgrade.

### 4. Docker needs ca-certificates

The `node:22-slim` Docker image does not include CA certificates. Without them, gRPC/TLS connections to the XMTP network fail silently with an unhelpful error:

```text
[Error: transport error] { code: 'GenericFailure' }
```

The fix is a single line in the Dockerfile:

```dockerfile
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
```

If you see `transport error` or `GenericFailure` in a Docker environment, check CA certificates first.

### 5. Persistent storage is critical

Every time the agent starts without its previous database files, it creates a new XMTP installation. You are limited to **10 installations per inbox**. If you exceed that limit by redeploying without persistence, the agent will stop working.

- **Railway**: Data persists across redeploys by default. You are fine out of the box.
- **Fly.io**: Use a mounted volume and set `XMTP_DB_DIRECTORY` to the mount path (e.g., `/data`).
- **Other platforms**: Make sure the directory containing `xmtp-*.db3*` files survives restarts and redeploys.

Also make sure you keep the same `XMTP_DB_ENCRYPTION_KEY` across deploys. A new encryption key means the agent cannot read its existing database, which forces a new installation.

### 6. Installation limit warnings

If you see messages like "You have N installations" in the logs, it means the agent has been creating new XMTP installations instead of reusing its existing one. This happens when:

- Database files are deleted between deploys
- The encryption key changes
- You deploy to a new environment without migrating the database

Fix: Ensure the database directory and encryption key persist across deploys.

### 7. The system prompt is the agent's personality

The most impactful change you can make to the agent is changing the system prompt. The XMTP wiring and Claude API calls stay identical regardless of what the agent does.

A mystical oracle:

```typescript
const SYSTEM_PROMPT = `You are the Mysterious Magic 8 Ball...`;
```

A customer service agent:

```typescript
const SYSTEM_PROMPT = `You are a helpful customer service representative for Acme Corp...`;
```

A trading advisor:

```typescript
const SYSTEM_PROMPT = `You are a cryptocurrency trading analyst. Given a token name, provide a brief risk assessment...`;
```

Same framework, same glue, different brain.

## Change the brain

The simplest customization is changing the system prompt (see tip #7 above). But you can also swap out the entire brain.

To use OpenAI instead of Claude, replace the `askTheBall` function:

```typescript
import OpenAI from "openai";

const openai = new OpenAI();

async function askTheBall(question: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: question },
    ],
  });
  return response.choices[0].message.content ?? "The spirits are silent...";
}
```

Or skip AI entirely and use simple rules:

```typescript
const ANSWERS = [
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  // ... all 20 answers
];

async function askTheBall(question: string): Promise<string> {
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
}
```

The messaging framework does not care what the brain is. It just sends and receives messages.
