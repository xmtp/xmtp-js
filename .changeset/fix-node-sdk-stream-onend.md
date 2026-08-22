---
"@xmtp/node-sdk": patch
---

Fixed `createStream` in `@xmtp/node-sdk` to properly destructure and invoke the `onEnd` callback when the stream is ended.
