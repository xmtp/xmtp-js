# XMTP Agent SDK for Node

This package provides the XMTP Agent SDK for Node.

To keep up with the latest SDK developments, see the [Issues tab](https://github.com/xmtp/xmtp-js/issues) in this repo.

> [!CAUTION]
> This SDK is in beta status and ready for you to build with in production. Software in this status may change based on feedback.

## Features

### Event-driven architecture

Subscribe to specific events and receive only the ones that matter to you using Node's `EventEmitter`:

```ts
agent.on("message", async (ctx) => {
  ctx.conversation.send("Hello!");
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
  async (ctx) => {
    ctx.conversation.send("Hey!");
  },
  filters.and(filters.notFromSelf, filters.textOnly),
);
```
