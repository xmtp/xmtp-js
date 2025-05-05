# @xmtp/browser-sdk

## 2.0.13

### Patch Changes

- 441a029: `AsyncStream` updates
  - Changed signature of `return` to allow no argument (e.g. `stream.return()`)
  - Added `end` alias that calls `return` without an argument
  - Added `AsyncStream` and `StreamCallback` to exports

## 2.0.12

### Patch Changes

- 616fdec: Added `null` option to `historySyncUrl` client option to allow disabling of history sync

## 2.0.11

### Patch Changes

- 5bc5a85: Update to the libxmtp stable release version

## 2.0.10

### Patch Changes

- 581d465: Added guard to prevent unexpected conversation types

## 2.0.9

### Patch Changes

- 4035fb5: Removed special sync groups from conversation list results

## 2.0.8

### Patch Changes

- fbce324: Fix welcome processing issue that could lead to incorrect group state

## 2.0.7

### Patch Changes

- 5a676b1: Propagated original error from workers

## 2.0.6

### Patch Changes

- b7a3001: Fixed message processing issue that could sometimes fork groups

## 2.0.5

### Patch Changes

- f0a43c4: Lowercase Ethereum addresses on static Client.canMessage calls

## 2.0.4

### Patch Changes

- Converted all `any` types to `unknown`
- Added generics for types with `unknown` where applicable
- Prevented `CodecNotFoundError` from throwing when instantiating `DecodedMessage`
- Added missing `signer` property to `Client`
- Updated code comments
- Updated dependencies [63e5276]
  - @xmtp/content-type-group-updated@2.0.2
  - @xmtp/content-type-primitives@2.0.2
  - @xmtp/content-type-text@2.0.2

## 2.0.3

### Patch Changes

- 6e54926: Exposed message decoding errors in streams

## 2.0.2

### Patch Changes

- f021255: Fixed missing key package status error

## 2.0.1

### Patch Changes

- 7e7fad4: Fixed error handling in `AsyncStream`

## 2.0.0

This release focuses on new features, stability, and performance.

## Upgrade from 1.1.4 to 2.0.0

Use the information in these release notes to upgrade from `@xmtp/browser-sdk` 1.1.4 to 2.0.0.

## Breaking changes

### Refactored `Client.create`

The database encryption key parameter was removed from the static `Client.create` method. To use a database encryption key, add it to the client options.

`1.x` code:

```typescript
import { Client, type Signer } from "@xmtp/browser-sdk";

const clientOptions = {
  /* client options */
};
const dbEncryptionKey = MY_ENCRYPTION_KEY;
const signer: Signer = {
  /* signer properties */
};
const client = await Client.create(signer, dbEncryptionKey, clientOptions);
```

`2.0.0` code:

```typescript
import { Client, type Signer } from "@xmtp/browser-sdk";

const clientOptions = {
  dbEncryptionKey: MY_ENCRYPTION_KEY,
};
const signer: Signer = { ... };
const client = await Client.create(signer, clientOptions);
```

### Refactored `Client` constructor

The `Client` constructor now only accepts a single parameter: client options. It's no longer possible to create a client with a signer using the constructor. Use `Client.create` to create a new client with a signer.

`1.x` code:

```typescript
import { Client, type Signer } from "@xmtp/browser-sdk";

const clientOptions = {
  /* client options */
};
const dbEncryptionKey = MY_ENCRYPTION_KEY;
const signer: Signer = {
  /* signer properties */
};
const client = new Client(signer, dbEncryptionKey, clientOptions);
```

`2.0.0` code:

```typescript
import { Client, type Signer } from "@xmtp/browser-sdk";

const clientOptions = {
  dbEncryptionKey: MY_ENCRYPTION_KEY,
};
const signer: Signer = { ... };
const client = await Client.create(signer, clientOptions);
```

### Client `accountIdentifier` method is now a property

`1.x` code:

```typescript
const identifier = await client.accountIdentifier();
```

`2.0.0` code:

```typescript
const identifier = client.accountIdentifier;
```

### Client options are now read-only

Setting client options after initialization is no longer possible.

### Removed `Opfs` export

This export was not usable in its exported form and has been removed. OPFS utilities to manage local databases will be added in a future release.

## New features

### Added `Client.build` static method

It's now possible to create a client without a signer using the new `Client.build` method. A signer is not required if an account is already registered on the XMTP network. Keep in mind, some client methods still require a signer.

```typescript
import { Client, type Identifier } from "@xmtp/browser-sdk";

const identifier: Identifier = {
  identifier: "0x1234567890abcdef1234567890abcdef12345678",
  identifierKind: "Ethereum",
};
const client = await Client.build(identifier, options);
```

### Added `changeRecoveryIdentifier` method to `Client`

The recovery identifier can now be changed. This method requires a client with a signer.

```typescript
import { Client, type Signer } from "@xmtp/browser-sdk";

const signer: Signer = { ... };
const client = await Client.create(signer, options);

const identifier: Identifier = {
  identifier: "0x1234567890abcdef1234567890abcdef12345678",
  identifierKind: "Ethereum",
};
await client.changeRecoveryIdentifier()
```

### Added `getKeyPackageStatusesForInstallationIds` method to `Client`

Key package status can now be retrieved for installation IDs. This new method returns a `Map` of installation IDs and their respective status.

```typescript
import { Client, type Identifier } from "@xmtp/browser-sdk";

const identifier: Identifier = {
  identifier: "0x1234567890abcdef1234567890abcdef12345678",
  identifierKind: "Ethereum",
};
const client = await Client.build(identifier, options);

type SafeKeyPackageStatus = {
  lifetime?: {
    notBefore: bigint;
    notAfter: bigint;
  };
  validationError?: string;
};

const keyPackageStatuses: Map<string, SafeKeyPackageStatus> =
  await client.getKeyPackageStatusesForInstallationIds([
    /* array of installation IDs here */
  ]);
```

## Added `getHmacKeys` method to `Conversation`

It's now possible to get the HMAC keys of individual conversations.

```typescript
type SafeHmacKey = {
  key: Uint8Array;
  epoch: bigint;
};

const conversation = client.conversations.getConversationById("...");

if (conversation) {
  const hmacKeys: SafeHmacKey[] = await conversation.getHmacKeys();
}
```

### Other changes

- Refactored static `Client.canMessage` to remove the creation of a temporary client
- Updated `dbPath` client option to allow `null` value
- Added custom error types
- Added `dbEncryptionKey` option to client options

## 1.1.4

### Patch Changes

- 8bd3930: Fixed removing inboxes with invalid key packages from groups

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

This release focuses on delivering an SDK for a stable, performant, and hardened XMTP V3.

> [!IMPORTANT]  
> Please upgrade your app to **use @xmtp/browser-sdk ≥ 1.0.0 by May 1, 2025** to continue using XMTP. On May 1, XMTP V3 will enforce this minimum SDK version. Apps on outdated V3 SDKs will lose connectivity.

## Upgrade from 0.0.x to 1.0.0

Use the information in these release notes to upgrade from @xmtp/browser-sdk 0.0.x to 1.0.0.

> [!IMPORTANT]  
> **Upgrading from a legacy XMTP V2 SDK?** Legacy XMTP V2 SDKs include JavaScript SDK vx.x.x. To learn how to upgrade to stable XMTP V3, be sure to also see important dates and considerations in [Upgrade from a legacy XMTP V2 SDK](https://docs.xmtp.org/upgrade-from-legacy-V2).

## Breaking changes

### Primary XMTP identifier is now an inbox ID, not an Ethereum address

In preparation for upcoming support for [Passkeys](https://community.xmtp.org/t/xip-55-passkey-identity/874), XMTP must evolve from using Ethereum account addresses (0x...) as the primary identifier to an inbox-based identity model.

This change allows for broader support of different authentication mechanisms, including the currently supported [Externally Owned Accounts (EOAs) and Smart Contract Wallets (SCWs)](https://docs.xmtp.org/inboxes/build-inbox#create-an-account-signer), as well as **future support** for Passkeys, Bitcoin, and Solana, for example.

The move to an inbox-based identity model means the following shift in approach when developing with XMTP:

- Instead of assuming an Ethereum address as the unique identifier, developers should default to using an inbox ID where possible.
- Where you previously used an Ethereum address, you must now use an inbox ID
  - `addMembers(addresses)` → `addMembers(inboxIds)`
  - `removeMember(addresses)` → `removeMembers(inboxIds)`
  - `newGroup(addresses)` → `newGroup(inboxIds)`
  - `newDm(address)` → `newDm(inboxId)`

> [!WARNING]
> These function changes (address → inbox ID) won't trigger errors since both parameters are strings. Your code will pass a type-check but may fail at runtime. Pay special attention to these changes when upgrading.

- The previous methods that allowed the use of an inbox ID have been removed in favor of the above methods

  - ~`addMembersByInboxIds(inboxIds)`~
  - ~`removeMembersByInboxIds(inboxIds)`~
  - ~`newGroupByInboxIds(inboxIds)`~
  - ~`newDmByInboxId(inboxId)`~

- New methods have been added to allow the use of addresses with the `Identifier` type

  - `addMembersByIdentifiers(Identifier[])`
  - `removeMembersByIdentifiers(Identifier[])`
  - `newGroupByIdentifiers(Identifier[])`
  - `newDmByIdentifier(Identifier)`

- We recommend moving away from using addresses in code completely. However, if you MUST use addresses, wrap them with the `Identifier` type.

  For example, the address `0x1234567890abcdef1234567890abcdef12345678` must now be wrapped like so:

  ```tsx
  const identifier: Identifier = {
    identifier: "0x1234567890abcdef1234567890abcdef12345678",
    identifierKind: "Ethereum",
  };
  ```

- Because XMTP is interoperable, you may interact with inboxes that are not on your app. In these scenarios, you will need to find the appropriate inbox ID or address.

  ```tsx
  // get an inbox ID from an address
  const inboxId = await getInboxIdForIdentifier({
    identifier: "0x1234567890abcdef1234567890abcdef12345678",
    identifierKind: "Ethereum",
  });

  // find the addresses associated with an inbox ID
  const inboxState = await client.inboxStateFromInboxIds([inboxId]);

  interface InboxState {
    inboxId: string;
    recoveryIdentifier: Identifier;
    installations: Installation[];
    identifiers: Identifier[];
  }

  const addresses = inboxState.identifiers
    .filter((i) => i.identifierKind === "Ethereum")
    .map((i) => i.identifier);
  ```

### Wallet and signer updates

The term “wallet” has been removed from the codebase. This is to align with future support for Passkeys and other non-wallet-based authentication methods.

This release includes breaking changes to the `Signer` type.

- The `walletType` field is now `type`. The `type` field refers to the type of account that will sign messages, such as an `EOA` or `SCW`.
- The `getAddress` field has been replaced by `getIdentifier`, which is a function that returns an `Identifier` type.

```tsx
// old
const address = await signer.getAddress();

// new
const identifier = await signer.getIdentifier();
// identifier may not be an Ethereum address
const address =
  identifier.identifierKind === "Ethereum" ? identifier.identifier : undefined;
```

### Consent and inbox state have been moved to `client.preferences`

Everything related to consent, inbox state, and user preferences is now part of the `Preferences` class and accessible via `client.preferences`.

- `client.inboxState` → `client.preferences.inboxState`
- `client.getLatestInboxState` → `client.preferences.getLatestInboxState`
- `client.inboxStateFromInboxIds` → `client.preferences.inboxStateFromInboxIds`
- `client.getConsentState` → `client.preferences.getConsentState`
- `client.setConsentStates` → `client.preferences.setConsentStates`
- `client.conversations.streamConsent` → `client.preferences.streamConsent`
- `client.conversations.streamPreferences` → `client.preferences.streamPreferences`

## Other recent changes

### Conversations are now instances of `Group` or `Dm`

The new `Group` and `Dm` classes extend the `Conversation` class and provide specific functionality based on the conversation type.

> [!NOTE]  
> `client.conversations.list()` now returns an array of `Group` or `Dm` classes. When accessing specific functionality based on conversation type, you must check the type first so that the TypeScript compiler can narrow the type.

```tsx
const conversations: (Group | Dm)[] = await client.conversations.list();

for (const conversation of conversations) {
  // narrow the type to Group to access the group name
  if (conversation instanceof Group) {
    console.log(group.name);
  }

  // narrow the type to Dm to access the peer inboxId
  if (conversation instanceof Dm) {
    console.log(conversation.peerInboxId);
  }
}
```

## Recently added features

### Disappearing messages

This release provides support for disappearing (ephemeral) messages. These are messages that are intended to be visible to users for only a short period of time. After the message expiration time passes, the messages are removed from the UI and deleted from local storage so the messages are no longer accessible to conversation participants.

To learn more, see [Support disappearing messages with XMTP](https://docs.xmtp.org/inboxes/disappearing-messages).

### Future-proofing app interoperability

This release introduces error handling that will help support app interoperability across SDK versions, even when breaking changes are required in the future.

In the future, an SDK version may introduce a breaking change, such as a feature that works only for apps on the latest versions of the SDK. Instead of forcing immediate upgrades or causing apps on older versions to break, this update adds a safety net that gracefully handles breaking changes.

At this time, no features rely on this mechanism, and no action is needed. However, this ensures your app remains resilient to future SDK updates that introduce breaking changes.

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
