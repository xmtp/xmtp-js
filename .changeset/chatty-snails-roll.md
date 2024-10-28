---
"@xmtp/node-sdk": patch
---

- Allowed for `undefined` content type and content in messages
- Filtered out messages without content when calling `Conversation.messages`
- Added generic typing for message content to `DecodedMessage` class and `Conversations.findMessageById`
- Replaced temporary group updated codec with official content type
