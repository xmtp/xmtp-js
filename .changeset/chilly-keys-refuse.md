---
"@xmtp/agent-sdk": patch
---

- Forced middleware to call `next` to execute the next middleware or `return` to break the middleware chain
- Made `use` accept an array of middlewares
- Forwarded options to `streamAllMessages`
- Replaced `generatePrivateKey` with implementation from `viem/accounts`
- Removed `@noble/curves` package
- Renamed `AgentEventHandler` to `AgentMessageHandler`
- Introduced error-handling middleware chain (`agent.errors.on`)
