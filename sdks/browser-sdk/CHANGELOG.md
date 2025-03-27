# @xmtp/browser-sdk

## 1.1.3

### Patch Changes

- 295e046: 
  - Fixed incorrect key package associations
  - Resolved DM stitching issues for conversations without messages

## 1.1.2

### Patch Changes

- 5845617: Refactored welcome message processing to prevent key package deletion on failure

## 1.1.1

### Patch Changes

- Updated dependencies [340fcf4]
  - @xmtp/content-type-group-updated@2.0.1
  - @xmtp/content-type-primitives@2.0.1
  - @xmtp/content-type-text@2.0.1
  - @xmtp/proto@3.78.0
  - uuid@11.1.0

## 1.1.0

### Minor Changes

- 999bb78: Added `inboxStateFromInboxIds` to `Preferences`

## 1.0.0

### Major Changes

- Updated `Signer` type
- Replaced address parameters with inbox IDs or identifiers
- Added new methods to use with identifiers
- Added `pausedForVersion` to `Conversation`
- Added new `Preferences` class accessible from `client.preferences`
- Updated exports
- Improved DM group stitching

## 1.0.0-rc1

- Updated `Signer` type
- Replaced address parameters with inbox IDs or identifiers
- Added new methods to use with identifiers
- Added `pausedForVersion` to `Conversation`
- Updated exports

## 0.0.23

### Patch Changes

- dd1a33a: Fixed stream errors

## 0.0.22

### Patch Changes

- 3cf6dd9:
  - Exposed all client signature methods
  - Added guard to `Client.addAccount` to prevent automatic reassignment of inboxes
  - Renamed `syncAdmins` to `listAdmins` and `syncSuperAdmins` to `listSuperAdmins`
  - Added consent and preference streaming
  - Removed `allowedStates`, `conversationType`, and `includeSyncGroups` from `ListConversationsOptions`
  - Added `contentTypes` option to `ListMessagesOptions`
  - Changed OPFS VFS to SyncAccessHandle Pool
  - Added more exports from the bindings
  - Added `Group` and `Dm` classes
  - Refactored some functions to use the new `Group` and `Dm` classes

## 0.0.21

### Patch Changes

- f53c967: Refactored `Signer`, made `getBlockNumber` optional for SCW signers

## 0.0.20

### Patch Changes

- 74ce850: Fix signer for SCW

## 0.0.19

### Patch Changes

- 03d2002:
  - Added `allowedStates`, `consentStates`, `includeSyncGroups`, and `includeDuplicateDms` options to `Conversations.list` method
  - Added `consentStates` option to `Conversations.syncAll` method
  - Added `newGroupByInboxIds` method to `Conversations`
  - Added `newDmByInboxId` method to `Conversations`
  - Added `messageDisappearingSettings` option for creating groups and DMs
  - Added `updateMessageDisappearingSettings` method to `Conversation`
  - Added `removeMessageDisappearingSettings` method to `Conversation`
  - Added `isMessageDisappearingEnabled` method to `Conversation`
  - Fixed invalid key package issues
  - Fixed rate limiting issues

## 0.0.18

### Patch Changes

- ec5cd41:
  - Added streaming methods
  - Removed group pinned frame URL metadata
  - Fixed DB locking issues

## 0.0.17

### Patch Changes

- 25e0e15:
  - Optimized `toSafeConversation`
  - Replaced some `??` with `||` to ensure string values are not empty

## 0.0.16

### Patch Changes

- 626d420: Fixed DM group syncing across installations

## 0.0.15

### Patch Changes

- cf6fbc0: Added default history sync URL to client with option to override

## 0.0.14

### Patch Changes

- c91612d: Added support for HMAC keys

## 0.0.13

### Patch Changes

- b4f452c: Added installation ID bytes to inbox state

## 0.0.12

### Patch Changes

- d09ec27:
  - Added support for revoking specific installations
  - Refactored `list`, `listGroups`, and `listDms` to be synchronous when called from worker

## 0.0.11

### Patch Changes

- 3a1e53b: Enabled group permissions updates
  - Added `updatePermission` method to `Conversation`
  - Refactored `permissions` getter to async function
  - Exported `MetadataField` type

## 0.0.10

### Patch Changes

- dad39c4:
  - Added admins and super admins to conversation data sync
  - Refactored `Conversation` admin and super admin accessors
    - Changed `admins` and `superAdmins` to getters
    - Added `syncAdmins` and `syncSuperAdmins` methods
  - Refactored `Conversations.getConversationById`, `Conversations.listDms`, `Conversations.listGroups`, and `Conversations.getDmByInboxId` to return `Conversation` instances
  - Refactored `Conversations.getMessageById` to return `DecodedMessage` instance

## 0.0.9

### Patch Changes

- a35afb8: Upgraded bindings, refactored some methods to be async

## 0.0.8

### Patch Changes

- 8120a39: Added support for custom permissions policy

## 0.0.7

### Patch Changes

- 1777a23: Dropped support for CommonJS
- Updated dependencies [1777a23]
  - @xmtp/content-type-group-updated@2.0.0
  - @xmtp/content-type-primitives@2.0.0
  - @xmtp/content-type-text@2.0.0

## 0.0.6

### Patch Changes

- 9324310:
  - Added `installationIdBytes` to `Client`
  - Added `Conversations.syncAll` method
  - Added `signWithInstallationKey`, `verifySignedWithInstallationKey`, and `verifySignedWithPublicKey` methods to `Client`

## 0.0.5

### Patch Changes

- 63e5276: Updated exports
- Updated dependencies [63e5276]
  - @xmtp/content-type-group-updated@1.0.1
  - @xmtp/content-type-primitives@1.0.3
  - @xmtp/content-type-text@1.0.1
  - @xmtp/proto@3.72.0

## 0.0.4

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

## 0.0.3

### Patch Changes

- f3734c8:
  - Upgraded to latest WASM bindings
  - Required `encryptionKey` when creating a new client
  - Added smart contract wallet signature support
  - Added more logging options
  - Updated WASM bindings re-exports

## 0.0.2

### Patch Changes

- 5479e31: Upgraded to latest WASM bindings

## 0.0.1

Initial release
