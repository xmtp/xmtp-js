---
"@xmtp/agent-sdk": patch
---

- Renamed `filter.textOnly` to `filter.isText`
- Renamed `AgentContext` to `MessageContext`
- Renamed event `on("message")` to `on("unhandledMessage")`
- Added `on("dm")` for direct messages
- Added `on("attachment")` for remote attachments
- Added `on("group")` for group messages
- Added `on("reaction")` for reactions
- Added `on("reply")` for replies
- Introduced `ConversationContext` for handling new conversations
