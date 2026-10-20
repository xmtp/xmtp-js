---
"@xmtp/agent-sdk": patch
---

Upgraded `@xmtp/node-sdk` from 6.0.0 to 6.1.1 (`@xmtp/node-bindings` 1.10.0 to 1.11.1).

- Fixed duplicate message events after a stream error. When a stream fails, the Agent ends its streams and opens new ones. In node-sdk 6.0.0, `end()` did not cancel a retry that was already scheduled, so an ended stream opened again and each message was delivered more than once. In 6.1.1, `end()` is final: no retry runs and no callback fires after it.
- Changed the TCP keep-alive so that it no longer races the HTTP/2 PING. The idle time is now 60 seconds (was 16 seconds), and the probe interval is always 10 seconds. This addresses a suspected cause of idle streams that were reset about every 35 seconds on Windows. `XMTP_GRPC_TCP_KEEPALIVE_SECS` still sets the idle time (`0` disables it).
- Raised the maximum group size from 250 to 500 members.

This upgrade also includes node-sdk 6.1.0, which adds `Client.close()`, database pool options, and OpenTelemetry options. In 6.1.0, the second argument of the conversation `send*` methods (for example `sendText`, `sendMarkdown`, `sendReaction`, `sendReply`, and `sendReadReceipt`) changed from a boolean to an options object. Replace `sendText(text, true)` with `sendText(text, { optimistic: true })`. TypeScript reports the old form as an error. In JavaScript, the boolean is ignored and the message is sent immediately, not optimistically.
