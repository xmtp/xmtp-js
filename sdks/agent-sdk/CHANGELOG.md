# @xmtp/agent-sdk

## 0.0.9

### Patch Changes

- 854a9d1: - Renamed `filter.textOnly` to `filter.isText`
  - Renamed `AgentContext` to `MessageContext`
  - Renamed event `on("message")` to `on("unhandledMessage")`
  - Added `on("dm")` for direct messages
  - Added `on("attachment")` for remote attachments
  - Added `on("group")` for group messages
  - Added `on("reaction")` for reactions
  - Added `on("reply")` for replies
  - Introduced `ConversationContext` for handling new conversations

## 0.0.8

### Patch Changes

- 0857103: - Forced middleware to call `next` to execute the next middleware or `return` to break the middleware chain
  - Made `use` accept an array of middlewares
  - Forwarded options to `streamAllMessages`
  - Replaced `generatePrivateKey` with implementation from `viem/accounts`
  - Removed `@noble/curves` package
  - Renamed `AgentEventHandler` to `AgentMessageHandler`
  - Introduced error-handling middleware chain (`agent.errors.on`)

## 0.0.7

### Patch Changes

- b296a2a: - Exposed default middleware
  - Exposed debug utils
  - Added default Reaction schema

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
