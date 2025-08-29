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
import { Agent, createSigner, createUser } from "@xmtp/agent-sdk";

// 1. Create a local user + signer (you can plug in your own wallet signer)
const user = createUser();
const signer = createSigner(user);

// 2. Spin up the agent
const agent = await Agent.create(signer, {
  env: "dev", // or 'production'
  dbPath: null, // in-memory store; provide a path to persist
});

// 3. Respond to any incoming message
agent.on("message", async (ctx) => {
  await ctx.conversation.send("Hello from my XMTP Agent! 👋");
});

// 4. Log when we're ready
agent.on("start", () => {
  const address = agent.client.accountIdentifier?.identifier;
  const env = agent.client.options?.env;
  console.log(`Agent online: http://xmtp.chat/dm/${address}?env=${env}`);
});

await agent.start();
```

## Environment Variables

The XMTP Agent SDK supports environment variables (`process.env`) to simplify configuration without code changes.

**Available Variables:**

| Variable                          | Purpose                                                                                                                      | Example                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `XMTP_WALLET_KEY`                 | [Private key for wallet](https://docs.xmtp.org/inboxes/core-messaging/create-a-signer)                                       | `XMTP_WALLET_KEY=0x1234...abcd`         |
| `XMTP_ENV`                        | [Network environment](https://docs.xmtp.org/agents/core-messaging/create-a-client#xmtp-network-environments)                 | `XMTP_ENV=dev` or `XMTP_ENV=production` |
| `XMTP_DB_ENCRYPTION_KEY`          | [Database encryption key](https://docs.xmtp.org/agents/core-messaging/create-a-client#keep-the-database-encryption-key-safe) | `XMTP_DB_ENCRYPTION_KEY=0xabcd...1234`  |
| `XMTP_FORCE_DEBUG`                | [Activate debugging logs](https://docs.xmtp.org/agents/debug-agents)                                                         | `XMTP_FORCE_DEBUG=true`                 |
| `XMTP_FORCE_REVOKE_INSTALLATIONS` | [Remove other installations](https://docs.xmtp.org/agents/core-messaging/agent-installations#revoke-agent-installations)     | `XMTP_FORCE_REVOKE_INSTALLATIONS=true`  |

Using the environment variables, you can setup your agent in just a few lines of code:

```ts
// Load variables from .env file
process.loadEnvFile(".env");

// Create agent using environment variables
const agent = await Agent.create();
```

## Core Concepts

### 1. Event‑Driven Architecture

Subscribe only to what you need using Node’s `EventEmitter` interface.

Events you can listen for:

- `message` – a new incoming (non‑self) message
- `start` / `stop` – lifecycle events
- `error` – surfaced errors

**Example:**

```ts
agent.on("error", (error) => {
  console.error("Agent error", error);
});
```

### 2. Middleware Support

Extend your agent with custom business logic using middlewares. Compose cross-cutting behavior like routing, telemetry, rate limiting, analytics, and feature flags, or plug in your own.

**Example:**

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

**Example:**

```ts
import { withFilter, filter } from "@xmtp/agent-sdk";

// Using filter in message handler
agent.on(
  "message",
  withFilter(filter.startsWith("@agent"), async (ctx) => {
    await ctx.conversation.send("How can I help you?");
  }),
);

// Combination of filters
const combined = filter.and(filter.notFromSelf, filter.textOnly);

agent.on(
  "message",
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
const longVersion = filter.and(filter.notFromSelf, filter.textOnly);
const shortVersion = f.and(f.notFromSelf, f.textOnly);
```

You can find all available prebuilt filters [here](https://github.com/xmtp/xmtp-js/blob/main/sdks/agent-sdk/src/utils/filter.ts).

### 4. Rich Context

Every `message` handler receives an `AgentContext` with:

- `message` – decoded message
- `conversation` – the active conversation object
- `client` – underlying XMTP client
- Helpers like `sendText()` / `sendTextReply()`

**Example:**

```ts
agent.on("message", async (ctx) => {
  await ctx.sendTextReply("Reply using helper ✨");
});
```

## Adding Custom Content Types

Pass codecs when creating your agent to extend supported content:

```ts
import { ReplyCodec } from "@xmtp/content-type-reply";

const agent = await Agent.create(signer, {
  env: "dev",
  dbPath: null,
  codecs: [new ReplyCodec()],
});
```

## Debugging

- [Debug an agent](https://docs.xmtp.org/agents/debug-agents)
- [Further debugging info](https://docs.xmtp.org/inboxes/debug-your-app#debug-your-inbox-app)

## FAQ (Quick Hits)

| Question                                                                                     | Answer                                          |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Does middleware run for every message?                                                       | Yes, in the order added.                        |
| How do I reject a message early?                                                             | Don’t call `next()` in middleware.              |
| How do I filter messages?                                                                    | Use `withFilter(...)` around an event listener. |
| Can I send custom [content types](https://docs.xmtp.org/agents/content-types/content-types)? | Yes, register codecs during agent creation.     |

## Contributing / Feedback

We’d love your feedback: [open an issue](https://github.com/xmtp/xmtp-js/issues) or discussion. PRs welcome for docs, examples, and core improvements.

---

Build something delightful. Then tell us what you wish was easier.

Happy hacking 💫
