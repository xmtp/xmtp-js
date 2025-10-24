# XMTP Agent SDK

Build event‑driven, middleware‑powered messaging agents on the XMTP network. 🚀

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
import { Agent } from "@xmtp/agent-sdk";
import { getTestUrl } from "@xmtp/agent-sdk/debug";
import { createUser, createSigner } from "@xmtp/agent-sdk/user";

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
  await ctx.sendText("Hello from my XMTP Agent! 👋");
});

// 4. Log when we're ready
agent.on("start", (ctx) => {
  console.log(`We are online: ${getTestUrl(ctx.client)}`);
});

await agent.start();
```

## Environment Variables

The XMTP Agent SDK supports configuration through environment variables (`process.env`), making it easy to configure your agent without code changes. Set the following variables and call `Agent.createFromEnv()` to automatically load them:

**Available Variables:**

| Variable                 | Purpose                                                                                                         | Example                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `XMTP_DB_DIRECTORY`      | [Database directory](https://docs.xmtp.org/agents/build-agents/local-database#understand-local-database-files)  | `XMTP_DB_DIRECTORY=my/database/dir`     |
| `XMTP_DB_ENCRYPTION_KEY` | [Database encryption key](https://docs.xmtp.org/agents/concepts/identity#keep-the-database-encryption-key-safe) | `XMTP_DB_ENCRYPTION_KEY=0xabcd...1234`  |
| `XMTP_ENV`               | [Network environment](https://docs.xmtp.org/chat-apps/core-messaging/create-a-client#xmtp-network-environments) | `XMTP_ENV=dev` or `XMTP_ENV=production` |
| `XMTP_WALLET_KEY`        | [Private key for Ethereum wallet](https://docs.xmtp.org/chat-apps/core-messaging/create-a-signer)               | `XMTP_WALLET_KEY=0x1234...abcd`         |

Using the environment variables, you can setup your agent in just a few lines of code:

```ts
// Load variables from .env file
process.loadEnvFile(".env");

// Create agent using environment variables
const agent = await Agent.createFromEnv();
```

Agents can also recognize the following environment variables:

| Variable                 | Purpose                                                              | Example                        |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------ |
| `XMTP_FORCE_DEBUG`       | [Activate debugging logs](https://docs.xmtp.org/agents/debug-agents) | `XMTP_FORCE_DEBUG=true`        |
| `XMTP_FORCE_DEBUG_LEVEL` | Specify the logging level (defaults to `"info"`)                     | `XMTP_FORCE_DEBUG_LEVEL=debug` |

## Core Concepts

### 1. Event‑Driven Architecture

Subscribe only to what you need using Node’s `EventEmitter` interface. Events you can listen for:

**Message Events**

- `attachment` – an incoming [remote attachment message](https://docs.xmtp.org/chat-apps/content-types/attachments)
- `message` – all messages that are not having a [custom content type](https://docs.xmtp.org/agents/content-types/content-types#custom-content-types)
- `group-update` – an incoming [group update](https://docs.xmtp.org/agents/content-types/group-updates#listen-for-group-updates) (like name change, member update, etc.)
- `reaction` – an incoming [reaction message](https://docs.xmtp.org/agents/content-types/reactions)
- `reply` – an incoming [reply message](https://docs.xmtp.org/agents/content-types/replies)
- `text` – an incoming [text message](https://docs.xmtp.org/agents/content-types/content-types#text-content-type)
- `unknownMessage` – a message event that does not correspond to any of the pre-implemented event types

**Conversation Events**

- `conversation` – a new group or DM conversation
- `dm` – a new DM conversation
- `group` – a new group conversation

**Lifecycle Events**

- `start` / `stop` – agent lifecycle events
- `unhandledError` – unhandled errors

**Example**

```ts
// Listen to specific message types
agent.on("text", async (ctx) => {
  console.log(`Text message: ${ctx.message.content}`);
});

agent.on("reaction", async (ctx) => {
  console.log(`Reaction: ${ctx.message.content}`);
});

agent.on("reply", async (ctx) => {
  console.log(`Reply to: ${ctx.message.content.reference}`);
});

// Listen to new conversations
agent.on("dm", async (ctx) => {
  await ctx.conversation.send("Welcome to our DM!");
});

agent.on("group", async (ctx) => {
  await ctx.conversation.send("Hello group!");
});

// Listen to unhandled events
agent.on("unhandledError", (error) => {
  console.error("Agent error", error);
});

agent.on("unknownMessage", (ctx) => {
  console.error("Message type is unknown", ctx);
});
```

> **⚠️ Important:** The `"message"` event fires for **every** incoming message, regardless of type. When using the `"message"` event, always filter message types to prevent infinite loops. Without proper filtering, your agent might respond to its own messages or react to system messages like read receipts.

**Best Practice Example**

```ts
import { filter } from "@xmtp/agent-sdk";

agent.on("message", async (ctx) => {
  // Filter for specific message types
  if (filter.isText(ctx.message)) {
    await ctx.conversation.send(`Echo: ${ctx.message.content}`);
  }
});
```

### 2. Middleware Support

Extend your agent with custom business logic using middlewares. Compose cross-cutting behavior like routing, telemetry, rate limiting, analytics, and feature flags, or plug in your own.

#### Standard Middleware

Middlewares can be registered with `agent.use` either one at a time or as an array. They are executed in the order they were added.

Middleware functions receive a `ctx` (context) object and a `next` function. Normally, a middleware calls `next()` to hand off control to the next one in the chain. However, a middleware can also alter the flow in the following ways:

1. Use `next()` to continue the chain and pass control to the next middleware
2. Use `return` to stop the chain and prevent events from firing
3. Use `throw` to trigger the error-handling middleware chain

**Example**

```ts
import { Agent, AgentMiddleware, filter } from "@xmtp/agent-sdk";

const onlyText: AgentMiddleware = async (ctx, next) => {
  if (filter.isText(ctx.message)) {
    // Continue to next middleware
    await next();
  }
  // Break middleware chain
  return;
};

const agent = await Agent.createFromEnv();
agent.use(onlyText);
```

#### Error-Handling Middleware

Error middleware can be registered with `agent.errors.use` either one at a time or as an array. They are executed in the order they were added.

Error middleware receives the `error`, `ctx`, and a `next` function. Just like regular middleware, the flow in error middleware depends on how to use `next`:

1. Use `next()` to mark the error as handled and continue with the main middleware chain
2. Use `next(error)` to forward the original (or transformed) error to the next error handler
3. Use `return` to end error handling and stop the middleware chain
4. Use `throw` to raise a new error to be caught by the error chain

**Example**

```ts
import { Agent, AgentErrorMiddleware } from "@xmtp/agent-sdk";

const errorHandler: AgentErrorMiddleware = async (error, ctx, next) => {
  if (error instanceof Error) {
    // Transform the error and pass it along
    await next(`Validation failed: ${error.message}`);
  } else {
    // Let other error handlers deal with it
    await next(error);
  }
};

const agent = await Agent.createFromEnv();
agent.errors.use(errorHandler);
```

#### Default Error Handler

Any error not handled by custom error middleware is caught by the default error handler and published to the `unhandledError` topic, where it can be observed.

**Example**

```ts
agent.on("unhandledError", (error) => {
  console.log("Caught error", error);
});
```

### 3. Built‑in Filters

Instead of manually checking every incoming message, you can use the provided filters.

**Example**

```ts
import { filter } from "@xmtp/agent-sdk";

// Using filter in message handler
agent.on("text", async (ctx) => {
  if (filter.isText(ctx.message)) {
    await ctx.conversation.send("You sent a text message!");
  }
});

// Combine multiple conditions
agent.on("text", async (ctx) => {
  if (
    filter.hasDefinedContent(ctx.message) &&
    !filter.fromSelf(ctx.message, ctx.client) &&
    filter.isText(ctx.message)
  ) {
    await ctx.conversation.send("Valid text message received ✅");
  }
});
```

For convenience, the `filter` object can also be imported as `f`:

```ts
// You can import either name:
import { filter, f } from "@xmtp/agent-sdk";

// Both work the same way:
if (f.isText(ctx.message)) {
  // Handle message...
}
```

**Available Filters:**

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

### 5. Starting Conversations

These functionalities let you start a conversation:

```ts
// Direct Message
const dm = await agent.createDmWithAddress("0x123");
await dm.send("Hello!");

// Group Conversation
const group = await agent.createGroupWithAddresses(["0x123", "0x456"]);
await group.addMembers(["0x789"]);
await group.send("Hello group!");
```

### 6. Utilities

The Agent SDK comes with subpackages that include utilities. You can for example get a testing URL or details of your Agent from the debug utilities:

```ts
import { getTestUrl, logDetails } from "@xmtp/agent-sdk/debug";

// Get a test URL for your agent
const testUrl = getTestUrl(agent.client);
console.log(`Test your agent at: ${testUrl}`);

// Log comprehensive details about your agent
await logDetails(agent.client);
```

There are also utilities to simplify user management, such as signer creation or name resolutions:

```ts
import {
  createUser,
  createSigner,
  createNameResolver,
} from "@xmtp/agent-sdk/user";

// Create a new user with a random private key
const user = createUser();

// Create a signer from the user
const signer = createSigner(user);

// Resolve ENS names or other web3 identities using web3.bio
const resolver = createNameResolver("your-web3bio-api-key");
const address = await resolver("vitalik.eth");
console.log(`Resolved address: ${address}`);
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

## LibXMTP Version

[LibXMTP](https://github.com/xmtp/libxmtp/) is a shared library encapsulating the core functionality of the XMTP messaging protocol, such as cryptography, networking, and language bindings. This version of the Agent SDK uses:

| XMTP Node SDK Version | LibXMTP Version |
| --------------------- | --------------- |
| 4.2.3                 | 1.5.4           |

To verify which LibXMTP version is installed, run `npm why @xmtp/node-bindings` after installing the Agent SDK.

## Debugging

- [Debug an agent](https://docs.xmtp.org/agents/debug-agents)
- [Further debugging info](https://docs.xmtp.org/inboxes/debug-your-app#debug-your-inbox-app)

## Contributing / Feedback

We’d love your feedback: [open an issue](https://github.com/xmtp/xmtp-js/issues) or discussion. PRs welcome for docs, examples, and core improvements.

---

Build something delightful. Then tell us what you wish was easier.

Happy hacking 💫
