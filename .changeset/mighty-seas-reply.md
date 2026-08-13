---
"@xmtp/cli": patch
---

Fix `--env-file` configuration values being ignored when the same `XMTP_*`
variable is already present in the process environment.
