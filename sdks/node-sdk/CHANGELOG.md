# @xmtp/node-sdk

## 0.0.24

### Patch Changes

- a1a16a0:
  - Added `Signer` interface
  - Refactored `Client.create` to accept a `Signer` instead of account address
  - Refactored client creation to automatically register and identity
  - Added `disableAutoRegister` to `ClientOptions` to allow disabling of client registration after creation
  - Removed direct access to all signature functions
  - Added `Client.register` method for registering a client
  - Added `Client.addAccount` method for adding another account to an installation
  - Added `Client.removeAccount` method for removing an account from an installation
  - Added `Client.revokeInstallations` method for revoking all other installations
  - Added static `Client.canMessage` for checking if an address is on the network without a client
  - Added environment to DB path

## 0.0.23

### Patch Changes

- 31ca82d:
  - Updated return type of `Client.canMessage` from Record to Map
  - Added requirement of encryption key when creating a client
  - Updated logging options
  - Added smart contract wallet support
  - Updated exports

## 0.0.22

### Patch Changes

- 5a41542:
  - Upgraded node bindings
  - Refactored code with updated type exports
  - Fixed streaming issues when a stream error occurs

## 0.0.21

### Patch Changes

- 764d6c0: Refactor streams for better error handling

## 0.0.20

### Patch Changes

- 981bcf4:
  - Added 1:1 messages
  - Added stream errors to the stream's async iterator values
  - Added consent state methods to client and conversation
  - Added signature methods for adding/revoke wallets and revoking installations
  - Added `getLatestInboxState` to client
  - Added inbox ID helpers

## 0.0.19

### Patch Changes

- 87457d6:
  - Allowed for `undefined` content type and content in messages
  - Filtered out messages without content when calling `Conversation.messages`
  - Added generic typing for message content to `DecodedMessage` class and `Conversations.findMessageById`
  - Replaced temporary group updated codec with official content type

## 0.0.18

### Patch Changes

- cdc9212: Update `@xmtp/node-bindings` to 0.0.14

## 0.0.17

### Patch Changes

- 5f02a9b:
  - Upgraded node bindings
  - Added `inboxStateFromInboxIds` method to client
  - Added logging option when creating a client

## 0.0.16

### Patch Changes

- b8f97ba: Upgrade to latest node bindings

### BREAKING CHANGE

This is a breaking change as some of the APIs have changed.

- `Client.signatureText` is now an async function
- `Client.addScwSignature` has been removed
- `Client.addEcdsaSignature` has been renamed to `Client.addSignature`
- `Conversation.members` is now an async function

## 0.0.15

### Patch Changes

- b8d9b36:
  - Upgraded to latest MLS node bindings
  - Added `inboxState` to Client

## 0.0.14

### Patch Changes

- 93f0fb9: Upgraded to latest MLS node bindings

## 0.0.13

### Patch Changes

- 4c0340b:
  - Upgraded `@xmtp/proto`
  - Upgraded MLS bindings
  - Added optimistic sending
  - Added `pinnedFrameUrl` metadata to conversations
  - Added `policySet` to conversation permissions

## 0.0.12

### Patch Changes

- 4ec046b:
  - Added conversation descriptions
  - Fixed DB locking issues
  - Fixed invalid policy error
  - Removed Admin status from group creators (Super Admin only)
  - Made content type optional when sending messages

## 0.0.11

### Patch Changes

- c506faf:
  - Upgraded to latest MLS node bindings
  - Added `requestHistorySync` and `getInboxIdByAddress` to `Client`
  - Renamed `get` to `getConversationById` in `Conversations`
  - Added `getMessageById` to `Conversations`

## 0.0.10

### Patch Changes

- b5db898: Upgrade node bindings for bug fixes

## 0.0.9

### Patch Changes

- a419052:
  - Upgrade to latest node bindings
  - Rename addErc1271Signature to addScwSignature
  - Add more options when creating a group with client.conversations.newConversation
  - Add getter and setter for group image URL
  - Add getter for group permissions
  - Add more tests
  - Add GroupPermissions to exports

## 0.0.8

### Patch Changes

- b87672a:
  - Add production environment
  - Allow for all environments when creating a client
  - Remove dependency on `@xmtp/xmtp-js` for content types and their primitives

## 0.0.7

### Patch Changes

- 8a9b624:
  - Add streaming callbacks
  - Add `get` method to `Conversations` for easy access to conversations that are created, listed, or streamed during a client session

## 0.0.6

### Patch Changes

- 6dd6a0e: Add `streamAllMessages` to Conversations

## 0.0.5

### Patch Changes

- ff6c304: Use correct inbox ID for all environments

## 0.0.4

### Patch Changes

- 632e6a3: Add conversation reference to messages

## 0.0.3

### Patch Changes

- 3006d8b: Upgrade MLS node bindings, add admin features

## 0.0.2

### Patch Changes

- ff5fcd7: Fix package.json issues

## 0.0.1

Initial release
