# XMTP Agent SDK for Node

This package provides the XMTP Agent SDK for Node.

To keep up with the latest SDK developments, see the [Issues tab](https://github.com/xmtp/xmtp-js/issues) in this repo.

> [!CAUTION]
> This SDK is in beta status and ready for you to build with in production. Software in this status may change based on feedback.

## Documentation

You can learn how to build an [agent for XMTP here](https://docs.xmtp.org/agents/get-started/build-an-agent).

## Install

**NPM**

```bash
npm install @xmtp/node-sdk
```

**PNPM**

```bash
pnpm install @xmtp/node-sdk
```

**Yarn**

```bash
yarn add @xmtp/node-sdk
```

## Usage

```ts
import { Agent, createSigner, createUser } from "@xmtp/agent-sdk";

const user = createUser();
const signer = createSigner(user);

const agent = await Agent.create(signer, {
  dbPath: null,
  env: "dev",
});

agent.on("message", async (ctx) => {
  await ctx.conversation.send("Hello!");
});

agent.on("start", () => {
  const address = agent.client.accountIdentifier?.identifier;
  const env = agent.client.options?.env;
  const url = `http://xmtp.chat/dm/${address}?env=${env}`;
  console.log(`We are online: ${url}`);
});

await agent.start();
```

## Features

### Event-driven architecture

Subscribe to specific events and receive only the ones that matter to you using Node's `EventEmitter`:

```ts
agent.on("message", async (ctx) => {
  await ctx.conversation.send("Hello!");
});
```

### Middleware support

Build flexible middleware pipelines by composing the tools you need (Custom Filters, Telemetry, Analytics, …):

```ts
const router = new CommandRouter();

router.command("/start", async (ctx) => {
  await ctx.conversation.send("👋 Welcome to your XMTP agent!");
});

const agent = new Agent({ client });
agent.use(router.middleware());
```

### Built-in Filters

Skip repetitive condition checks with ready-to-use message filters, easily chained through a fluent API:

```ts
agent.on(
  "message",
  withFilter(filter.and(filter.notFromSelf, filter.textOnly), async (ctx) => {
    await ctx.conversation.send("Hey!");
  }),
);
```
