---
"@xmtp/agent-sdk": patch
---

Fixed `LimitedMap.set()` evicting a valid entry when updating an existing key at capacity. It now checks whether the key already exists before evicting, so updating a key's value at capacity no longer drops an unrelated entry.
