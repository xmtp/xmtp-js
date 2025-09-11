---
"@xmtp/agent-sdk": patch
---

- Removed "crypto" and "message" utils
- Removed `filter.notFromSelf` in favor of `!filter.fromSelf`
- Added `filter.hasDefinedContent`
- Added `filter.isDM`
- Added `filter.isGroup`
- Added `filter.isReaction`
- Added `filter.isRemoteAttachment`
- Added `filter.isReply`
- Added `filter.isTextReply`
- Allowed async filters
- Added tests to verify typed message content in event callbacks
