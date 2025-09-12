---
"@xmtp/agent-sdk": patch
---

- Renamed `ctx.getOwnAddress()` to `ctx.getClientAddress()`
- Added `AgentError` class with `cause` attribute (keeping the originating error)
- Introduced error `code` values for programmatic handling of `AgentError` instances
- Added Context hierarchy: `ClientContext` → client, `ConversationContext` → client, conversation, `MessageContext` → client, conversation, message
- Added `AgentContext` union type for all contexts
- Error middleware now receives `AgentErrorContext` (holds client, conversation, message if available)
