# @xmtp/node-sdk

## 2.0.6

### Patch Changes

- 5bc5a85: Update to the libxmtp stable release version

## 2.0.5

### Patch Changes

- 581d465: Added guard to prevent unexpected conversation types

## 2.0.4

### Patch Changes

- fbce324: Fix welcome processing issue that could lead to incorrect group state

## 2.0.3

### Patch Changes

- b7a3001: Fixed message processing issue that could sometimes fork groups

## 2.0.2

### Patch Changes

- f0a43c4: Lowercase Ethereum addresses on static Client.canMessage calls

## 2.0.1

### Patch Changes

- Removed filter for messages when content is `undefined`
- Converted all `any` types to `unknown`
- Added generics for types with `unknown` where applicable
- Prevented `CodecNotFoundError` from throwing when instantiating `DecodedMessage`
- Added code comments
- Updated dependencies
  - @xmtp/content-type-group-updated@2.0.2
  - @xmtp/content-type-primitives@2.0.2
  - @xmtp/content-type-text@2.0.2

## 2.0.0

This release focuses on new features, stability, and performance.

### Upgrade from 1.2.1 to 2.0.0

Use the information in these release notes to upgrade from `@xmtp/node-sdk` version `1.2.1` to `2.0.0`.

### Breaking changes

#### Refactored `Client.create`

The database encryption key parameter was removed from the static `Client.create` method. To use a database encryption key, add it to the client options.

`1.x` code:

```typescript
import { Client, type ClientOptions, type Signer } from "@xmtp/node-sdk";

const clientOptions: ClientOptions = { ... };
const dbEncryptionKey = MY_ENCRYPTION_KEY;
const signer: Signer = { ... };
const client = await Client.create(signer, dbEncryptionKey, clientOptions);
```

`2.0.0` code:

```typescript
import { Client, type ClientOptions, type Signer } from "@xmtp/node-sdk";

const clientOptions: ClientOptions = {
  dbEncryptionKey: MY_ENCRYPTION_KEY,
};
const signer: Signer = { ... };
const client = await Client.create(signer, clientOptions);
```

#### Refactored `Client` constructor

The `Client` constructor now only accepts a single parameter: client options. It's no longer possible to create a client with a signer using the constructor. Use `Client.create` to create a new client with a signer.

`1.x` code:

```typescript
import { Client, type Signer } from "@xmtp/node-sdk";

const signer: Signer = { ... };
const client = new Client(XMTPClient, signer, codecs);
```

`2.0.0` code:

```typescript
import { Client, type ClientOptions, type Signer } from "@xmtp/node-sdk";

const clientOptions: ClientOptions = {
  dbEncryptionKey: MY_ENCRYPTION_KEY,
};
const signer: Signer = { ... };
const client = await Client.create(signer, clientOptions);
```

#### Client `identifier` property is now `accountIdentifier`

`1.x` code:

```typescript
const identifier = await client.identifier;
```

`2.0.0` code:

```typescript
const identifier = client.accountIdentifier;
```

#### Removed `requestHistorySync` method from client

Device sync is being refactored and this method will not be compatible with a future version. Removing it now with these breaking changes so we don't need to bump the major version in the near future.

### New features

#### Added `Client.build` static method

It's now possible to create a client without a signer using the new `Client.build` method. A signer is not required if an account is already registered on the XMTP network. Keep in mind, some client methods still require a signer.

```typescript
import { Client, IdentifierKind, type ClientOptions, type Identifier } from "@xmtp/node-sdk";

const clientOptions: ClientOptions = { ... };
const identifier: Identifier = {
  identifier: "0x1234567890abcdef1234567890abcdef12345678",
  identifierKind: IdentifierKind.Ethereum,
};
const client = await Client.build(identifier, clientOptions);
```

### Other changes

- Updated `dbPath` client option to allow `null` value
- Added more custom error types
- Added `dbEncryptionKey` option to client options
- Added `options` property to client
- Added `signer` property to client

## 1.2.1

### Patch Changes

- 6e54926: Exposed message decoding errors in streams

## 1.2.0

### Minor Changes

- d35fbc1:
  - Added `getHmacKeys` to `Conversation`
  - Added custom errors

## 1.1.1

### Patch Changes

- 7e7fad4: Fixed error handling in `AsyncStream`

## 1.1.0

### Minor Changes

- 88e6ff6:
  - Added `unsafe_changeRecoveryIdentifierSignatureText` method to client
  - Added `changeRecoveryIdentifier` method to client
  - Added `getKeyPackageStatusesForInstallationIds` method to client

## 1.0.5

### Patch Changes

- 8bd3930: Fixed removing inboxes with invalid key packages from groups

## 1.0.4

### Patch Changes

- 295e046:
  - Fixed incorrect key package associations
  - Resolved DM stitching issues for conversations without messages

## 1.0.3

### Patch Changes

- 5845617: Refactored welcome message processing to prevent key package deletion on failure

## 1.0.2

### Patch Changes

- Updated dependencies [340fcf4]
  - @xmtp/content-type-group-updated@2.0.1
  - @xmtp/content-type-primitives@2.0.1
  - @xmtp/content-type-text@2.0.1
  - @xmtp/proto@3.78.0

## 1.0.1

### Patch Changes

- 607ae92: Fixed `IdentifierKind` enum export in build

## 1.0.0

### Major Changes

- Updated `Signer` type
- Replaced address parameters with inbox IDs or identifiers
- Added new methods to use with identifiers
- Added `pausedForVersion` to `Conversation`
- Added new `Preferences` class accessible from `client.preferences`
- Renamed `newGroupByIdentifiers` to `newGroupWithIdentifiers`
- Renamed `newDmByIdentifier` to `newDmWithIdentifier`
- Updated exports
- Improved DM group stitching

## 1.0.0-rc2

- Renamed `newGroupByIdentifiers` to `newGroupWithIdentifiers`
- Renamed `newDmByIdentifier` to `newDmWithIdentifier`

## 1.0.0-rc1

- Updated `Signer` type
- Replaced address parameters with inbox IDs or identifiers
- Added new methods to use with identifiers
- Added `pausedForVersion` to `Conversation`
- Updated exports

## 0.0.47

### Patch Changes

- dd1a33a:
  - Fixed stream errors
  - Fixed build for later node versions

## 0.0.46

### Patch Changes

- 3cf6dd9:
  - Exposed all client signature methods
  - Refactored client signature methods to return `undefined` instead of `null`
  - Added guard to `Client.addAccount` to prevent automatic reassignment of inboxes
  - Removed `allowedStates`, `conversationType`, and `includeSyncGroups` from `ListConversationsOptions`
  - Added `contentTypes` option to `ListMessagesOptions`
  - Added more exports from the bindings
  - Added `Group` and `Dm` classes
  - Refactored some functions to use the new `Group` and `Dm` classes

## 0.0.45

### Patch Changes

- 5221111:
  - Added new methods to create groups by inbox ID
  - Added consent states option to `syncAllConversations`
  - Updated list conversations options to include `consentStates` and `includeDuplicateDms`
  - Removed automatic message filtering from DM groups
  - Added disappearing messages methods to conversations
  - Added optional `listMessage` property to `Conversation`
  - Added consent streaming
  - Added preferences streaming
  - Added `Client.version` static getter

## 0.0.44

### Patch Changes

- c63d8af: Make `getBlockNumber` optional for SCW signers

## 0.0.43

### Patch Changes

- 68b0200: Refactored `Signer` type

## 0.0.42

### Patch Changes

- ec5cd41:
  - Removed group pinned frame URL metadata
  - Fixed DB locking issues

## 0.0.41

### Patch Changes

- 931c4a4: Updated `createDm` to return an existing DM group, if it exists

## 0.0.40

### Patch Changes

- 25e0e15: Replaced some `??` with `||` to ensure string values are not empty

## 0.0.39

### Patch Changes

- 626d420: Fixed DM group syncing across installations

## 0.0.38

### Patch Changes

- cf6fbc0: Added default history sync URL to client with option to override

## 0.0.37

### Patch Changes

- d09ec27:
  - Added support for revoking specific installations
  - Refactored `list`, `listGroups`, and `listDms` to be synchronous

## 0.0.36

### Patch Changes

- d84932a: Added support for HMAC keys

## 0.0.35

### Patch Changes

- 3a1e53b: Enabled group permissions updates
  - Added `updatePermission` method to `Conversation`
  - Exported `MetadataField` type

## 0.0.34

### Patch Changes

- a35afb8: Upgraded bindings, refactored some methods to be async

## 0.0.33

### Patch Changes

- 8120a39: Added support for custom permissions policy

## 0.0.32

### Patch Changes

- 1777a23: Dropped support for CommonJS
- Updated dependencies [1777a23]
  - @xmtp/content-type-group-updated@2.0.0
  - @xmtp/content-type-primitives@2.0.0
  - @xmtp/content-type-text@2.0.0

## 0.0.31

### Patch Changes

- 9c625ad: Do not create local DB when calling the `Client.canMessage` static method

## 0.0.30

### Patch Changes

- 7338e0e:
  - Removed authorization instance methods from client
  - Added static authorization methods to client
  - Upgraded to latest node bindings

## 0.0.29

### Patch Changes

- f1b93bb: Upgraded to latest node bindings

## 0.0.28

### Patch Changes

- a1f27b8:
  - Added `isAddressAuthorized` to `Client`
  - Added `isInstallationAuthorized` to `Client`

## 0.0.27

### Patch Changes

- 9324310:
  - Added `installationIdBytes` to `Client`
  - Refactored `Client.verifySignedWithInstallationKey` to return a `boolean`
  - Changed `Client.verifySignedWithPublicKey` to a static method

## 0.0.26

### Patch Changes

- 7661f78:
  - Added `syncAll` method to `Conversations`
  - Added `signWithInstallationKey`, `verifySignedWithInstallationKey`, and `verifySignedWithPublicKey` to `Client`

## 0.0.25

### Patch Changes

- 63e5276: Updated exports
- Updated dependencies [63e5276]
  - @xmtp/content-type-group-updated@1.0.1
  - @xmtp/content-type-primitives@1.0.3
  - @xmtp/content-type-text@1.0.1
  - @xmtp/proto@3.72.0

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
