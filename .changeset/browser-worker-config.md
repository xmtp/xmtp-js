---
"@xmtp/browser-sdk": minor
---

Exposed background worker scheduler tuning on the client.

`ClientOptions` now accepts `workerConfig` (a `WorkerConfigOptions` with default/per-worker intervals, jitter, and disabled workers), and the `WorkerKind`, `WorkerConfigOptions`, and `WorkerIntervalOverride` types are re-exported for use with it.
