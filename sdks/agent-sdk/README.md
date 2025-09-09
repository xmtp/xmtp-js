# XMTP Agent SDK

Build event‑driven, middleware‑powered messaging agents on the XMTP network. 🚀

> [!CAUTION]
> This SDK is in beta status and ready for you to build with in production. Software in this status may change based on feedback.

## Documentation

Full agent building guide: **[Build an XMTP Agent](https://docs.xmtp.org/agents/get-started/build-an-agent)**

This SDK is based on familiar Node.js patterns: you register event listeners, compose middleware, and extend behavior just like you would in frameworks such as [Express](https://expressjs.com/). This makes it easy to bring existing JavaScript and TypeScript skills into building conversational agents.

## Installation

Choose your package manager:

```bash
npm install @xmtp/agent-sdk
# or
pnpm add @xmtp/agent-sdk
# or
yarn add @xmtp/agent-sdk
```

## Quick Start

```ts
import { createUser, createSigner, Agent, getTestUrl } from "@xmtp/agent-sdk";

// 1. Create a local user + signer (you can plug in your own wallet signer)
const user = createUser();
const signer = createSigner(user);

// 2. Spin up the agent
const agent = await Agent.create(signer, {
  env: "dev", // or 'production'
  dbPath: null, // in-memory store; provide a path to persist
});

// 3. Respond to text messages
agent.on("text", async (ctx) => {
  await ctx.conversation.send("Hello from my XMTP Agent! 👋");
});

// 4. Log when we're ready
agent.on("start", () => {
  console.log(`We are online: ${getTestUrl(agent)}`);
});

await agent.start();
```

## Environment Variables

The XMTP Agent SDK allows you to use environment variables (`process.env`) for easier configuration without modifying code. Simply set the following variables and call `Agent.createFromEnv()`:

**Available Variables:**

| Variable                 | Purpose                                                                                                                      | Example                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `XMTP_WALLET_KEY`        | [Private key for wallet](https://docs.xmtp.org/inboxes/core-messaging/create-a-signer)                                       | `XMTP_WALLET_KEY=0x1234...abcd`         |
| `XMTP_ENV`               | [Network environment](https://docs.xmtp.org/agents/core-messaging/create-a-client#xmtp-network-environments)                 | `XMTP_ENV=dev` or `XMTP_ENV=production` |
| `XMTP_DB_ENCRYPTION_KEY` | [Database encryption key](https://docs.xmtp.org/agents/core-messaging/create-a-client#keep-the-database-encryption-key-safe) | `XMTP_DB_ENCRYPTION_KEY=0xabcd...1234`  |

Using the environment variables, you can setup your agent in just a few lines of code:

```ts
// Load variables from .env file
process.loadEnvFile(".env");

// Create agent using environment variables
const agent = await Agent.createFromEnv();
```

Agents can also recognize the following environment variables:

| Variable           | Purpose                                                              | Example                 |
| ------------------ | -------------------------------------------------------------------- | ----------------------- |
| `XMTP_FORCE_DEBUG` | [Activate debugging logs](https://docs.xmtp.org/agents/debug-agents) | `XMTP_FORCE_DEBUG=true` |

## Core Concepts

### 1. Event‑Driven Architecture

Subscribe only to what you need using Node’s `EventEmitter` interface. Events you can listen for:

**Message Events**

- `text` – a new incoming text message
- `reaction` – a new incoming reaction message
- `reply` – a new incoming reply message
- `attachment` – a new incoming remote attachment message
- `unhandledMessage` – a message that doesn't match any specific type

**Conversation Events**

- `dm` – a new DM conversation
- `group` – a new group conversation

**Lifecycle Events**

- `start` / `stop` – agent lifecycle events
- `unhandledError` – unhandled errors

**Example**

```ts
// Handle different message types
agent.on("text", async (ctx) => {
  console.log(`Text message: ${ctx.text}`);
});

agent.on("reaction", async (ctx) => {
  console.log(`Reaction: ${ctx.message.content}`);
});

agent.on("reply", async (ctx) => {
  console.log(`Reply to: ${ctx.message.content.reference}`);
});

// Handle new conversations
agent.on("dm", async (ctx) => {
  await ctx.conversation.send("Welcome to our DM!");
});

agent.on("group", async (ctx) => {
  await ctx.conversation.send("Hello group!");
});

// Handle uncaught errors
agent.on("unhandledError", (error) => {
  console.error("Agent error", error);
});
```

### 2. Middleware Support

Extend your agent with custom business logic using middlewares. Compose cross-cutting behavior like routing, telemetry, rate limiting, analytics, and feature flags, or plug in your own.

**Example**

```ts
import { CommandRouter } from "@xmtp/agent-sdk";

const router = new CommandRouter();

router.command("/version", async (ctx) => {
  await ctx.conversation.send(`v${process.env.npm_package_version}`);
});

agent.use(router.middleware());
```

### 3. Built‑in Filters

Instead of manually checking every incoming message, you can compose simple, reusable filters that make intent clear.

**Example**

```ts
import { withFilter, filter } from "@xmtp/agent-sdk";

// Using filter in message handler
agent.on(
  "text",
  withFilter(filter.startsWith("@agent"), async (ctx) => {
    await ctx.conversation.send("How can I help you?");
  }),
);

// Combination of filters
const combined = filter.and(filter.notFromSelf, filter.isText);

agent.on(
  "text",
  withFilter(combined, async (ctx) => {
    await ctx.conversation.send("You sent a text message ✅");
  }),
);
```

For convenience, the `filter` object can also be imported as `f`:

```ts
// You can import either name:
import { filter, f } from "@xmtp/agent-sdk";

// Both work the same way:
const longVersion = filter.and(filter.notFromSelf, filter.isText);
const shortVersion = f.and(f.notFromSelf, f.isText);
```

You can find all available prebuilt filters [here](https://github.com/xmtp/xmtp-js/blob/main/sdks/agent-sdk/src/utils/filter.ts).

### 4. Rich Context

Every message event handler receives a `MessageContext` with:

- `message` – the decoded message object
- `conversation` – the active conversation object
- `client` – underlying XMTP client
- Helpers like `sendTextReply()`, `sendReaction()`, `getSenderAddress`, and more

**Example**

```ts
agent.on("text", async (ctx) => {
  await ctx.sendTextReply("Reply using helper ✨");
});
```

## Adding Custom Content Types

Pass `codecs` when creating your agent to extend supported content:

```ts
const agent = await Agent.create(signer, {
  env: "dev",
  dbPath: null,
  codecs: [new MyContentType()],
});
```

## Debugging

- [Debug an agent](https://docs.xmtp.org/agents/debug-agents)
- [Further debugging info](https://docs.xmtp.org/inboxes/debug-your-app#debug-your-inbox-app)

## Contributing / Feedback

We’d love your feedback: [open an issue](https://github.com/xmtp/xmtp-js/issues) or discussion. PRs welcome for docs, examples, and core improvements.

---

Build something delightful. Then tell us what you wish was easier.

Happy hacking 💫
