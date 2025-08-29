---
"@xmtp/agent-sdk": patch
---

- Made `signer` optional in `Agent.create` to allow Agent configuration via env variables
- Introduced `crypto` utils
- Exposed `filter` with `f` alias
- Introduced `XMTP_FORCE_REVOKE_INSTALLATIONS` and `XMTP_FORCE_DEBUG`
- Removed `Agent.build`
- Added `gen:keys` command for agent contributors
- Added `CommandRouter` middleware
- Added `startsWith` filter
- Added codecs for `Reaction` and `RemoteAttachment`
- Added `sendReaction` functionality through `AgentContext`
- Added `getOwnAddress()` in `AgentContext`
- Added `debug` util with `logDetails()` functionality
- Added `message` utils with type guards for different content types
