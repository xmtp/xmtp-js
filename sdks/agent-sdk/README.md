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
npm install @xmtp/agent-sdk @xmtp/node-sdk
# or
pnpm add @xmtp/agent-sdk @xmtp/node-sdk
# or
yarn add @xmtp/agent-sdk @xmtp/node-sdk
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
const router = new CommandRouter();

router.command("/start", async (ctx) => {
  await ctx.conversation.send("👋 Welcome to your XMTP agent!");
});

agent.use(router.middleware());
```

### 3. Built‑in Filters

Instead of manually checking every incoming message, you can compose simple, reusable filters that make intent clear.

**Example:**

```ts
import { withFilter, filter } from "@xmtp/agent-sdk";

const filters = filter.and(filter.notFromSelf, filter.textOnly);

agent.on(
  "message",
  withFilter(filters, async (ctx) => {
    await ctx.conversation.send("You sent a text message ✅");
  }),
);
```

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

## Development Resources

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
