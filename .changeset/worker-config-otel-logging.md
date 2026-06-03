---
"@xmtp/node-sdk": minor
---

Exposed background worker scheduler tuning and OpenTelemetry logging options on the client.

`ClientOptions` now accepts `workerConfig` (a `WorkerConfigOptions` with default/per-worker intervals, jitter, and disabled workers), `otelEndpoint`, and `resourceAttributes`. The `flushTelemetry` function and the `WorkerKind`, `WorkerConfigOptions`, and `WorkerIntervalOverride` types are re-exported for use with these options. Call `flushTelemetry()` on graceful shutdown to flush buffered telemetry spans when an `otelEndpoint` is configured.
