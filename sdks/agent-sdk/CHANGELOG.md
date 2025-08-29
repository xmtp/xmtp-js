# @xmtp/agent-sdk

## 0.0.6

### Patch Changes

- 8277202: Locked dependency versions

## 0.0.5

### Patch Changes

- 071aed4: - Made `signer` optional in `Agent.create` to allow Agent configuration via env variables
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

## 0.0.4

### Patch Changes

- 880f8f2: Added path alias resolution

## 0.0.3

### Patch Changes

- f83dcf9: Fixed module resolution for ESM

## 0.0.2

### Patch Changes

- 5a2bd1e: Fixed dist reference in Agent SDK
