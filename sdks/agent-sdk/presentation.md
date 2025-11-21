---
marp: true
theme: default
paginate: true
backgroundColor: #fff
backgroundImage: url('https://marp.app/assets/hero-background.svg')
---

<!-- _class: invert -->

# 🚀 XMTP Agent SDK

**Build event-driven messaging agents on XMTP**

`npm.im/@xmtp/agent-sdk`

---

## What is XMTP Agent SDK?

Build **conversational agents** that:

- 📨 Respond to messages automatically
- 🎯 Handle events (DMs, groups, reactions, etc.)
- 🔌 Use middleware for extensibility
- 💾 Persist conversations in local database

Think **Express.js for messaging** 🎉

---

## Installation

Choose your package manager:

```bash
npm install @xmtp/agent-sdk

# or
pnpm add @xmtp/agent-sdk

# or
yarn add @xmtp/agent-sdk
```

---

<!-- _class: invert -->

# 📋 Step 1: Setup Environment Variables

---

## Environment Variables

Create a `.env` file in your project root:

```bash
# Required: Your wallet private key (hex format)
XMTP_WALLET_KEY=0x1234567890abcdef...

# Optional: Network environment
XMTP_ENV=dev  # or 'production'

# Optional: Database persistence
XMTP_DB_DIRECTORY=./data

# Optional: Encrypt your database
XMTP_DB_ENCRYPTION_KEY=0xabcd...1234
```

---

## Environment Variables Explained

| Variable                 | Purpose                                      |
| ------------------------ | -------------------------------------------- |
| `XMTP_WALLET_KEY`        | Private key for your agent's wallet identity |
| `XMTP_ENV`               | Network (`dev` or `production`)              |
| `XMTP_DB_DIRECTORY`      | Where to store conversation data             |
| `XMTP_DB_ENCRYPTION_KEY` | Secure your local database                   |

⚠️ **Important**: Keep `XMTP_WALLET_KEY` and `XMTP_DB_ENCRYPTION_KEY` secret!

---

<!-- _class: invert -->

# 🎬 Step 2: Create Your Agent

---

## Create Agent from Environment

Load your `.env` file and create the agent:

```typescript
import { Agent } from "@xmtp/agent-sdk";
import { loadEnvFile } from "node:process";

// Load environment variables
loadEnvFile(".env");

// Create agent using environment variables
const agent = await Agent.createFromEnv();
```

That's it! Your agent is ready 🎉

---

## Alternative: Manual Setup

If you prefer not to use environment variables:

```typescript
import { Agent } from "@xmtp/agent-sdk";
import { createUser, createSigner } from "@xmtp/agent-sdk/user";

const user = createUser();
const signer = createSigner(user);

const agent = await Agent.create(signer, {
  env: "dev",
  dbPath: null, // in-memory (or provide path)
});
```

---

<!-- _class: invert -->

# 💬 Step 3: Responding to Messages

---

## Listen to Text Messages

```typescript
agent.on("text", async (ctx) => {
  console.log(`Received: ${ctx.message.content}`);

  // Send a reply
  await ctx.sendText("Hello! 👋");
});
```

Simple event-driven pattern you already know!

---

## Available Message Events

```typescript
agent.on("text", async (ctx) => {
  /* text messages */
});
agent.on("reaction", async (ctx) => {
  /* emoji reactions */
});
agent.on("reply", async (ctx) => {
  /* message replies */
});
agent.on("attachment", async (ctx) => {
  /* file attachments */
});
agent.on("markdown", async (ctx) => {
  /* markdown content */
});
agent.on("read-receipt", async (ctx) => {
  /* read receipts */
});
agent.on("group-update", async (ctx) => {
  /* group changes */
});
```

---

## Rich Context Helper Methods

Every event handler receives a `ctx` with helpful methods:

```typescript
agent.on("text", async (ctx) => {
  // Simple text reply
  await ctx.sendText("Hi there!");

  // Reply to the message
  await ctx.sendTextReply("Replying to you!");

  // Send markdown
  await ctx.sendMarkdown("**Bold** and *italic*");

  // React to message
  await ctx.sendReaction("👍");
});
```

---

## Example: Echo Bot

```typescript
agent.on("text", async (ctx) => {
  const message = ctx.message.content;

  // Echo back the message
  await ctx.sendText(`You said: ${message}`);
});

agent.on("start", () => {
  console.log("Echo bot is online! 🎙️");
});

await agent.start();
```

---

<!-- _class: invert -->

# 👥 Step 4: Creating Conversations

---

## Start a Direct Message (DM)

```typescript
// Create a DM with an Ethereum address
const dm = await agent.createDmWithAddress(
  "0x1234567890123456789012345678901234567890",
);

// Send a message
await dm.send("Hello! This is a DM.");
```

Perfect for reaching out to users!

---

## Create a Group Conversation

```typescript
// Create a group with multiple addresses
const group = await agent.createGroupWithAddresses([
  "0x1111111111111111111111111111111111111111",
  "0x2222222222222222222222222222222222222222",
  "0x3333333333333333333333333333333333333333",
]);

// Send to the group
await group.send("Welcome to the group! 🎉");

// Add more members
await group.addMembers(["0x4444444444444444444444444444444444444444"]);
```

---

## Listen for New Conversations

```typescript
// Listen for all new conversations
agent.on("conversation", async (ctx) => {
  console.log(`New conversation: ${ctx.conversation.id}`);
});

// Listen specifically for DMs
agent.on("dm", async (ctx) => {
  await ctx.sendText("Thanks for the DM! 💌");
});

// Listen specifically for groups
agent.on("group", async (ctx) => {
  await ctx.sendMarkdown("**Hello, group!** 👋");
});
```

---

<!-- _class: invert -->

# 🔌 Step 5: Adding Middleware

---

## What is Middleware?

Middleware lets you:

- ✅ Filter messages
- ✅ Add logging/analytics
- ✅ Implement rate limiting
- ✅ Route commands
- ✅ Transform messages

Just like Express.js middleware!

---

## Simple Middleware Example

```typescript
import type { AgentMiddleware } from "@xmtp/agent-sdk";

const logger: AgentMiddleware = async (ctx, next) => {
  console.log(`📨 Message from: ${ctx.message.senderInboxId}`);
  console.log(`📝 Content: ${ctx.message.content}`);

  // Continue to next middleware
  await next();
};

agent.use(logger);
```

---

## Filter Messages with Middleware

```typescript
import { filter } from "@xmtp/agent-sdk";
import type { AgentMiddleware } from "@xmtp/agent-sdk";

const onlyText: AgentMiddleware = async (ctx, next) => {
  // Only process text messages
  if (filter.isText(ctx.message)) {
    await next();
  }
  // Otherwise, stop the chain (return)
};

agent.use(onlyText);
```

---

## Built-in CommandRouter Middleware

```typescript
import { CommandRouter } from "@xmtp/agent-sdk/middleware";

const router = new CommandRouter();

router.command("/hello", async (ctx) => {
  await ctx.sendText("Hi there! 👋");
});

router.command("/help", async (ctx) => {
  await ctx.sendText("Available commands: /hello, /help, /status");
});

router.default(async (ctx) => {
  await ctx.sendText(`Unknown command: ${ctx.message.content}`);
});

agent.use(router.middleware());
```

---

## Multiple Middleware Chain

```typescript
const loggerMW: AgentMiddleware = async (ctx, next) => {
  console.log("📨 Message received");
  await next();
};

const filterSelfMW: AgentMiddleware = async (ctx, next) => {
  if (!filter.fromSelf(ctx.message, ctx.client)) {
    await next();
  }
};

const rateLimitMW: AgentMiddleware = async (ctx, next) => {
  // Your rate limiting logic
  await next();
};

// Add all middleware
agent.use(loggerMW, filterSelfMW, rateLimitMW);
```

---

<!-- _class: invert -->

# 🛠️ Advanced: Error Handling

---

## Error Handling Middleware

```typescript
import type { AgentErrorMiddleware } from "@xmtp/agent-sdk";

const errorHandler: AgentErrorMiddleware = async (error, ctx, next) => {
  console.error("❌ Error occurred:", error);

  if (error instanceof Error) {
    // Transform and forward
    await next(`Validation failed: ${error.message}`);
  } else {
    // Handle or forward
    await next(error);
  }
};

agent.errors.use(errorHandler);
```

---

## Listen for Unhandled Errors

```typescript
agent.on("unhandledError", (error) => {
  console.error("🚨 Unhandled error:", error);

  // Log to monitoring service
  // Send alert
  // etc.
});
```

---

<!-- _class: invert -->

# 🎯 Complete Example

---

## Full Agent Implementation

```typescript
import { Agent } from "@xmtp/agent-sdk";
import { CommandRouter } from "@xmtp/agent-sdk/middleware";
import { loadEnvFile } from "node:process";

// Load environment
loadEnvFile(".env");

// Create agent
const agent = await Agent.createFromEnv();

// Setup command router
const router = new CommandRouter()
  .command("/hello", async (ctx) => {
    await ctx.sendText("Hello! 👋");
  })
  .command("/help", async (ctx) => {
    await ctx.sendText("Commands: /hello, /help, /ping");
  })
  .command("/ping", async (ctx) => {
    await ctx.sendText("Pong! 🏓");
  });
```

---

## Full Agent Implementation (cont.)

```typescript
// Use router middleware
agent.use(router.middleware());

// Listen to new groups
agent.on("group", async (ctx) => {
  await ctx.sendMarkdown("**Welcome!** Type `/help` for commands.");
});

// Handle reactions
agent.on("reaction", async (ctx) => {
  console.log(`Got reaction: ${ctx.message.content.content}`);
});

// Lifecycle
agent.on("start", () => {
  console.log("🚀 Agent is online!");
});

// Start the agent
await agent.start();
```

---

<!-- _class: invert -->

# 🎓 Key Takeaways

---

## What You Learned

✅ **Setup**: Configure with environment variables
✅ **Create**: Use `Agent.createFromEnv()`
✅ **Respond**: Handle events with `.on("text", ...)`
✅ **Initiate**: Create DMs and groups
✅ **Extend**: Add middleware for routing and filtering

---

## Best Practices

1. 🔐 **Keep secrets safe**: Use `.env` for keys, never commit them
2. 💾 **Use database**: Set `XMTP_DB_DIRECTORY` for persistence
3. 🛡️ **Filter wisely**: Avoid infinite loops, filter self-messages
4. 🔌 **Compose middleware**: Keep middleware focused and reusable
5. 🐛 **Handle errors**: Add error middleware for graceful failures

---

## Resources

📚 **Documentation**: https://docs.xmtp.org/agents
📦 **NPM Package**: npm.im/@xmtp/agent-sdk
💻 **GitHub**: github.com/xmtp/xmtp-js
👩‍💻 **Starter Kit**: github.com/xmtp/agent-sdk-starter

---
