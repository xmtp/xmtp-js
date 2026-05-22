---
"@xmtp/node-sdk": minor
---

Added `Client.close()` for clean shutdown. It cancels in-flight workers and detached streams, then releases the database connection. The method is idempotent — await it before deleting the database file or dropping the client reference to avoid log noise from background tasks running against a closed database.
