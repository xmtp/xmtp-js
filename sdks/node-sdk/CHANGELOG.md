# @xmtp/node-sdk

## 4.2.4

### Patch Changes

- 9003bb9: Enable hex strings as database encryption keys

## 4.2.3

### Patch Changes

- 61c19c9:
  - Fixed an issue where duplicate welcome errors were fired erroneously
  - Fixed a bug where building a client did a network request when not needed

## 4.2.2

### Patch Changes

- b7a860e: Refactored `lastMessage()` method of `Conversation` to always query the database

## 4.2.1

### Patch Changes

- 0abcb05: Fixed initial group membership validation

## 4.2.0

- Improved performance of syncing new groups
- Added support for Lens chain Smart Contract Wallet verifier
- Fixed OpenMLS issue for persistence during message processing
- Fixed lifetime validation gaps

## 4.1.2

### Patch Changes

- bb4163f: - Added `onError` callback when stream reconnection fails
  - Updated `uuid` dependency to v13

## 4.1.1

### Patch Changes

- 5b0160e: Updated `dbPath` client option to allow callback function

## 4.1.0

This release introduces improved fork detection. If you've been building on a previous release, this one should be a **drop-in replacement**. Update as soon as possible to take advantage of this enhancement.

### Improved fork detection

The `isCommitLogForked` field provides definitive fork detection without false positives. To minimize the negative effects of spam, fork detection is active only for groups that a user has actively consented to.

Important: The `maybeForked` field has been deprecated. You can now use `isCommitLogForked` instead to get definitive fork detection without false positives.

To learn more, see [Forked group debugging tool](https://docs.xmtp.org/inboxes/debug-your-app#forked-group-debugging-tool).

## 4.0.3

### Patch Changes

- ed36644: Reverted performance improvement for large inboxes that caused message streaming issues

## 4.0.2

### Patch Changes

- ffec6e0:
  - Improved performance for large inboxes
  - Improved key package errors
  - Added `appVersion` client option
  - Added `debugEventsEnabled` client option
  - Fixed DM stitching bug
  - Added expiration to messages for disappearing messages

## 4.0.1

### Patch Changes

- 3170da0: Improved syncAll performance when syncing large numbers of conversations

## 4.0.0

This release introduces several enhancements to improve stream reliability. It contains breaking changes.

### Stream reliability improvements

When streams fail, an attempt to reconnect will be made automatically. By default, a stream will be retried 6 times with a 10 second delay between each retry. Maximum retries and retry delay can be configured with the `retryAttempts` and `retryDelay` options, respectively. To disable this feature, set the `retryOnFail` option to `false`.

During the retry process, the `onRetry` and `onRestart` callbacks can be used to monitor progress.

### BREAKING CHANGES

#### All streaming methods are now async and accept a single options argument

The new argument defines streaming options:

```ts
type StreamOptions<T = unknown, V = T> = {
  /**
   * Called when the stream ends
   */
  onEnd?: () => void;
  /**
   * Called when a stream error occurs
   */
  onError?: (error: Error) => void;
  /**
   * Called when the stream fails
   */
  onFail?: () => void;
  /**
   * Called when the stream is restarted
   */
  onRestart?: () => void;
  /**
   * Called when the stream is retried
   */
  onRetry?: (attempts: number, maxAttempts: number) => void;
  /**
   * Called when a value is emitted from the stream
   */
  onValue?: (value: V) => void;
  /**
   * The number of times to retry the stream
   * (default: 6)
   */
  retryAttempts?: number;
  /**
   * The delay between retries (in milliseconds)
   * (default: 10000)
   */
  retryDelay?: number;
  /**
   * Whether to retry the stream if it fails
   * (default: true)
   */
  retryOnFail?: boolean;
};
```

In addition to these options, some streaming methods have more options. See their respective types for more details.

Update your calls to each streaming method as follows:

```ts
// OLD
const conversationStream = client.conversations.stream(callback, onFail);
const groupStream = client.conversations.streamGroups(callback, onFail);
const dmStream = client.conversations.streamDms(callback, onFail);
const allMessagesStream = await client.conversations.streamAllMessages(
  callback,
  conversationType,
  consentStates,
  onFail,
);
const allGroupMessagesStream = await client.conversations.streamAllGroupMessages(
  callback,
  consentStates,
  onFail,
);
const allDmMessagesStream = await client.conversations.streamAllDmMessages(
  callback,
  consentStates,
  onFail,
);

const consentStream = client.preferences.streamConsent(callback, onFail);
const preferencesStream = client.preferences.streamPreferences(callback, onFail);

const messagesStream = conversation.stream(callback, onFail);

// NEW
const conversationStream = await client.conversations.stream({
  onError,
  onValue,
  onFail
});
const groupStream = await client.conversations.streamGroups({
  onError,
  onValue,
  onFail
});
const dmStream = await client.conversations.streamDms({
  onError,
  onValue,
  onFail
});
const allMessageStream = await client.conversations.streamAllMessages({
  consentStates,
  conversationType
  onError,
  onValue,
  onFail
});
const allGroupMessagesStream = await client.conversations.streamAllGroupMessages({
  consentStates,
  onError,
  onValue,
  onFail,
});
const allDmMessagesStream = await client.conversations.streamAllDmMessages({
  consentStates,
  onError,
  onValue,
  onFail,
});

const consentStream = await client.preferences.streamConsent({
  onError,
  onValue,
  onFail,
});
const preferencesStream = await client.preferences.streamPreferences({
  onError,
  onValue,
  onFail,
});

const messagesStream = await conversation.stream({
  onError,
  onValue,
  onFail
});
```

#### Streams no longer end on error

When a stream error occurs, it's passed to the `onError` callback only. The stream will remain active.

#### Stream types have changed

When using the `for await..of` loop, the value will never be `undefined`.

```ts
const stream = await client.conversations.streamAllMessages();

for await (const message of stream) {
  // message will always be an instance of DecodedMessage
}
```

## 3.2.2

### Patch Changes

- 78c6710:
  - Resolved issue with too many key package API requests
  - Fixed issue causing users with old installations to sometimes not be added to groups
  - Fixed a performance bottleneck that affected listing conversations while syncing

## 3.2.1

### Patch Changes

- 41aeaae:
  - Improved sync and stream performance
  - Increased max installations to 10
  - Fixed a known fork issue
  - Added key package rotation every 30 days

## 3.2.0

This release introduces several enhancements, including quantum-resistant encryption, improved identity management, and refined read/write rate limits.

If you've been building on a previous release, this one should be a **drop-in replacement**. Update as soon as possible to take advantage of these enhancements and fixes.

### Support for quantum-resistant encryption

XMTP now supports quantum-resistant encryption, providing enhanced security for message transmission and storage. This upgrade ensures your app is protected against future quantum computer attacks through post-quantum cryptography.

To learn more, see [Quantum resistance](https://docs.xmtp.org/protocol/security#quantum-resistance).

### Consistent identity ordering

When an inbox has multiple associated identities, the `identities` array is now ordered by the `client_timestamp_ns` field, which sorts identities based on when they were added to the inbox, placing the earliest added identity first.

To learn more, see [Select the identity to display](https://docs.xmtp.org/inboxes/manage-inboxes#select-the-identity-to-display).

### Enhanced rate limits with separate read/write limits

XMTP now provides separate rate limits for read and write operations, offering more granular control over API usage. Read operations are limited to 20,000 requests per 5-minute window, while write operations are limited to 3,000 messages per 5-minute window.

To learn more, see [Observe rate limits](https://docs.xmtp.org/inboxes/rate-limits).

### Improved history sync

History sync has been enhanced with better consent management across installations and improved handling of denied conversations. These changes ensure a more consistent experience when users access XMTP from multiple installations.

To learn more, see [Enable history sync](https://docs.xmtp.org/inboxes/history-sync).

### Enhanced group chat updates

Group membership changes now automatically trigger group update codec messages, ensuring all participants receive consistent information about group state changes. This improves the reliability of group chat synchronization across all devices.

To learn more, see [Manage group chat membership](https://docs.xmtp.org/inboxes/group-permissions#manage-group-chat-membership).

### Performance improvements and bug fixes

This release includes various performance optimizations throughout the SDK, resulting in faster message processing, improved memory usage, and better overall responsiveness. The release also includes bug fixes that improve the reliability of group chats and address a performance degradation issue that could occur when creating new groups.

To learn more about optimizing your XMTP implementation, see [Debug your app](https://docs.xmtp.org/inboxes/debug-your-app).

## 3.1.3

### Patch Changes

- 3f4d125:
  - Refactored `AsyncStream` to be more spec-compliant
  - Added `onDone` callback to `AsyncStream`
  - Updated stream methods to use new `onDone` callback to end streams

## 3.1.2

### Patch Changes

- 6b2e3d4: Improved gRPC connection detection

## 3.1.1

### Patch Changes

- e8fbfac: Fixed group syncing on larger groups

## 3.1.0

### Minor Changes

- b72f006: Added `onFail` callback option to stream methods

## 3.0.1

### Patch Changes

- 10bf2d1: Fix forks

## 3.0.0

This update introduces enhancements for managing installations without a client. It also contains breaking changes related to signature management and consistency across SDKs.

### BREAKING CHANGES

#### Debug information has been moved to `client.debugInformation`

To better align with our mobile SDKs, debug information helpers are now accessible at the `debugInformation` property of client instances.

Update your calls to the following:

- `client.apiStatistics()` => `client.debugInformation.apiStatistics()`
- `client.apiIdentityStatistics()` => `client.debugInformation.apiIdentityStatistics()`
- `client.apiAggregateStatistics()` => `client.debugInformation.apiAggregateStatistics()`
- `client.clearAllStatistics()` => `client.debugInformation.clearAllStatistics()`
- `client.uploadDebugArchive()` => `client.debugInformation.uploadDebugArchive()`

#### Signatures are now managed through signature requests

This change only affects developers who are using custom workflows with the `unsafe_*SignatureText` client methods. When using a custom signing workflow, use the new `unsafe_*SignatureRequest` methods.

**Example**

```ts
// change the recovery identifier
const signatureRequest =
  await this.unsafe_changeRecoveryIdentifierSignatureRequest(newIdentifier);

await this.unsafe_addSignature(signatureRequest);
await this.unsafe_applySignatureRequest(signatureRequest);
```

As part of this change, the `SignatureRequestType` export has been replaced with `SignatureRequestHandle`.

### Other changes

- Added `Client.revokeInstallations` static method for revoking installations without a client
- Added `Client.inboxStateFromInboxIds` static method for getting inbox state without a client

## 2.2.1

### Patch Changes

- e86b0c9: Fixed async iterator exit when calling `end()` on `AsyncStream`

## 2.2.0

This update introduces several targeted enhancements and clarifications related to managing client builds, network statistics, installations, and group chats.

If you’ve been building on a previous release, this one should be a **drop-in replacement**. Update as soon as possible to take advantage of these enhancements and fixes.

### Reset network statistics for debugging

A new helper, `clearAllStatistics()`, lets you reset all API/identity/stream network statistics counters.

Use it to get a clean baseline between test runs or free memory on devices where cached gRPC stats grow over time.

To learn more, see [Network statistics](https://docs.xmtp.org/inboxes/debug-your-app#network-statistics).

### Support installation limits and more targeted revocations

XMTP now enforces up to 5 app installations per inbox ID.

When the installation limit is reached, you can revoke an installation to free up a slot.

To learn more, see [Revoke installations](https://docs.xmtp.org/inboxes/manage-inboxes#revoke-installations).

### Support slightly larger group chats

The maximum group chat size has been raised from 220 to 250 members.

To learn more, see [Create a new group chat](https://docs.xmtp.org/inboxes/create-conversations#create-a-new-group-chat).

### Reduced risk of group chat forks

Additional safeguards have been added to minimize the chance of unintended group chat forks.

To learn about what group chat forks are and how they can occur, see [MLS Group State Forks: What, Why, How](https://cryspen.com/post/mls-fork-resolution/).

## 2.1.0

This release delivers enhancements to messaging performance and reliability, as well as a set of developer debugging tools, all focused on making it easier to build with XMTP.

If you’ve been building on a previous release, this one should be a **drop-in replacement**—just update to the latest version to take advantage of everything below.

### Consent-based listing, streaming, and syncing

By default, `conversations.list`, `conversations.listGroups`, `conversations.listDms`, `conversations.syncAll`, `conversations.streamAllMessages`, `conversations.streamAllGroupMessages`, and `conversations.streamAllDmMessages` now filter for conversations with a consent state of `ConsentState.Allowed` or `ConsentState.Unknown`.

We recommend listing `ConsentState.Allowed` conversations only. This ensures that spammy conversations with a consent state of `ConsentState.Unknown` don't degrade the user experience.

To include all conversations regardless of consent state, you can pass `[ConsentState.Allowed, ConsentState.Unknown, ConsentState.Denied]`.

### Optimistic group chat creation

Provides faster and offline group chat creation and message preparation before adding members.

### Group chat member limit

**A 220-member limit is now enforced for group chats.** This helps prevent errors that oversized groups can cause and ensures consistent behavior across clients.

### Preference sync

Preference syncing enables you to sync the following preference-related information across multiple existing app installations:

- Conversation consent preferences
- Conversation HMAC keys (for push notifications)

### Developer tooling and debugging

Delivers tools and features for debugging when building with XMTP, including group chat diagnostics, file logging, and network statistics.

### Reliability and performance

- Reliability improvements to message history
- Reliability improvements to [`streamAll`](https://docs.xmtp.org/inboxes/list-and-stream#stream-all-group-chat-and-dm-messages)
- Performance improvements to `peerInboxId`
- [Duplicate DMs](https://docs.xmtp.org/inboxes/push-notifs/understand-push-notifs#dm-stitching-considerations-for-push-notifications) removed from streams

## 2.0.9

### Patch Changes

- 441a029: `AsyncStream` updates
  - Changed signature of `return` to allow no argument (e.g. `stream.return()`)
  - Added `end` alias that calls `return` without an argument
  - Added `AsyncStream` to exports

## 2.0.8

### Patch Changes

- 609b509: Do not stop stream on benign message processing errors

## 2.0.7

### Patch Changes

- 616fdec: Added `null` option to `historySyncUrl` client option to allow disabling of history sync

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
