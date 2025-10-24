# @xmtp/agent-sdk

## 1.1.9

### Patch Changes

- bde0bfb: Expose `XMTP_DB_DIRECTORY` for `Agent.createFromEnv`

## 1.1.8

### Patch Changes

- 9003bb9: Enable hex strings as database encryption keys
- Updated dependencies [9003bb9]
  - @xmtp/node-sdk@4.2.4

## 1.1.7

### Patch Changes

- 8279497: Added warning about installation limit

## 1.1.6

### Patch Changes

- 932f01d: - Fixed an issue where duplicate welcome errors were fired erroneously
  - Fixed a bug where building a client did a network request when not needed

## 1.1.5

### Patch Changes

- d0798bc: Updated `@xmtp/node-sdk` dependency to `^4.2.2`

## 1.1.4

### Patch Changes

- 45160dc: Added `MessageContext.useCodec` to identify custom content types

## 1.1.3

### Patch Changes

- 3c28612: Added XMTP_FORCE_DEBUG_LEVEL env variable

## 1.1.2

### Patch Changes

- 9538002: Added ENS name resolution

## 1.1.1

### Patch Changes

- a0b5d11: Updated Node SDK in Agent SDK

## 1.1.0

### Minor Changes

- 70d1a21: Added listening to conversation events

## 1.0.1

### Patch Changes

- 54577da: Added "group-update" events

## 1.0.0

### Major Changes

- 5b0c9f8: Removed Beta label

## 0.0.17

### Patch Changes

- e0b035c: - Added conversation creation

## 0.0.16

### Patch Changes

- 07ea5c3: - Exposed `debug`, `middleware`, and `user` packages
  - Passed `ClientContext` to `start` and `stop` event listeners

## 0.0.15

### Patch Changes

- 07fa1c3: Implemented message streaming with callbacks

## 0.0.14

### Patch Changes

- 4da121f: Remove listening to `'dm'` and `'group'` events

## 0.0.13

### Patch Changes

- b4f86cc: - Simplified filter usage with parameter-based API
  - Removed `withFilter`
  - Changed all interface definitions to type definitions
  - Updated `ConversationContext` to use new filter methods
  - Introduced unified context types in `AgentContext`

## 0.0.12

### Patch Changes

- 2bcf5ee: - Renamed `ctx.getOwnAddress()` to `ctx.getClientAddress()`
  - Added `AgentError` class with `cause` attribute (keeping the originating error)
  - Introduced error `code` values for programmatic handling of `AgentError` instances
  - Added Context hierarchy: `ClientContext` → client, `ConversationContext` → client, conversation, `MessageContext` → client, conversation, message
  - Added `AgentContext` union type for all contexts
  - Error middleware now receives `AgentErrorContext` (holds client, conversation, message if available)

## 0.0.11

### Patch Changes

- 7e0c321: - Removed "crypto" and "message" utils
  - Removed `filter.notFromSelf` in favor of `!filter.fromSelf`
  - Added `filter.hasDefinedContent`
  - Added `filter.isDM`
  - Added `filter.isGroup`
  - Added `filter.isReaction`
  - Added `filter.isRemoteAttachment`
  - Added `filter.isReply`
  - Added `filter.isTextReply`
  - Allowed async filters
  - Added tests to verify typed message content in event callbacks

## 0.0.10

### Patch Changes

- 20d64c3: Skipped messages from agent itself in middleware

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
