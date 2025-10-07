# @xmtp/browser-sdk

## 5.0.1

### Patch Changes

- 61c19c9:
  - Fixed an issue where duplicate welcome errors were fired erroneously
  - Fixed a bug where building a client did a network request when not needed

## 5.0.0

### BREAKING CHANGES

- 90089b0: Refactored `Conversation.isActive` to async method for more accurate value

## 4.3.0

### Minor Changes

- b7a860e: Added `lastMessage()` method to `Conversation`

## 4.2.1

### Patch Changes

- 0abcb05: Fixed initial group membership validation

## 4.2.0

- Improved performance of syncing new groups
- Added support for Lens chain Smart Contract Wallet verifier
- Fixed OpenMLS issue for persistence during message processing
- Fixed lifetime validation gaps

## 4.1.0

This release introduces improved fork detection. If you've been building on a previous release, this one should be a **drop-in replacement**. Update as soon as possible to take advantage of this enhancement.

### Improved fork detection

The `isCommitLogForked` field provides definitive fork detection without false positives. To minimize the negative effects of spam, fork detection is active only for groups that a user has actively consented to.

Important: The `maybeForked` field has been deprecated. You can now use `isCommitLogForked` instead to get definitive fork detection without false positives.

To learn more, see [Forked group debugging tool](https://docs.xmtp.org/inboxes/debug-your-app#forked-group-debugging-tool).

## 4.0.2

### Patch Changes

- ed36644: Reverted performance improvement for large inboxes that caused message streaming issues

## 4.0.1

### Patch Changes

- ffec6e0:
  - Improved performance for large inboxes
  - Improved key package errors
  - Added `appVersion` client option
  - Added `debugEventsEnabled` client option
  - Fixed DM stitching bug
  - Added expiration to messages for disappearing messages

## 4.0.0

This release introduces several enhancements to improve stream reliability. It contains breaking changes.

### Stream reliability improvements

When streams fail, an attempt to reconnect will be made automatically. By default, a stream will be retried 6 times with a 10 second delay between each retry. Maximum retries and retry delay can be configured with the `retryAttempts` and `retryDelay` options, respectively. To disable this feature, set the `retryOnFail` option to `false`.

During the retry process, the `onRetry` and `onRestart` callbacks can be used to monitor progress.

### BREAKING CHANGES

#### All streaming methods now accept a single options argument

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
const conversationStream = await client.conversations.stream(callback, onFail);
const groupStream = await client.conversations.streamGroups(callback, onFail);
const dmStream = await client.conversations.streamDms(callback, onFail);
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

const consentStream = await client.preferences.streamConsent(callback, onFail);
const preferencesStream = await client.preferences.streamPreferences(callback, onFail);

const messagesStream = await conversation.stream(callback, onFail);

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

## 3.1.2

### Patch Changes

- 78c6710:
  - Resolved issue with too many key package API requests
  - Fixed issue causing users with old installations to sometimes not be added to groups
  - Fixed a performance bottleneck that affected listing conversations while syncing

## 3.1.1

### Patch Changes

- 41aeaae:
  - Improved sync and stream performance
  - Increased max installations to 10
  - Fixed a known fork issue
  - Added key package rotation every 30 days

## 3.1.0

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

## 3.0.5

### Patch Changes

- 3f4d125:
  - Refactored `AsyncStream` to be more spec-compliant
  - Added `onDone` callback to `AsyncStream`
  - Updated stream methods to use new `onDone` callback to end streams

## 3.0.4

### Patch Changes

- e0b7745:
  - Fixed group syncing on larger groups
  - Fixed HTTP stream panic when subscription request fails

## 3.0.3

### Patch Changes

- 8729f02:
  - Increased max payload size to `25MB`
  - Improved `syncAll` performance

## 3.0.2

### Patch Changes

- 63c144d: Fixed static installation revokation

## 3.0.1

### Patch Changes

- 10bf2d1: Fixed some issues that may cause group forks

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

This change only affects developers who are using custom workflows with the `unsafe_*SignatureText` client methods.

When using a custom signing workflow, the `unsafe_*SignatureText` client methods now return an object with the following type:

```ts
type SignatureRequestResult = {
  signatureText: string;
  signatureRequestId: string;
};
```

After signing the `signatureText`, you must create a special signer and pass it to the `unsafe_applySignatureRequest` client method along with the `signatureRequestId`.

**Example**

```ts
// change the recovery identifier
const { signatureText, signatureRequestId } =
  await this.unsafe_changeRecoveryIdentifierSignatureText(newIdentifier);
// use a `Signer` to sign the signature text
const signature = await signer.signMessage(signatureText);
// `toSafeSigner` is a new export from `@xmtp/browser-sdk`
const safeSigner = await toSafeSigner(signer, signature);

await client.unsafe_applySignatureRequest(safeSigner, signatureRequestId);
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

## 2.1.1

### Patch Fixes

Fixes streaming bug that would sometimes cause streams to miss messages

Fixes stream conversations bug that would hang all conversations streams upon a backend node update adding a field to welcome messages

updates @xmtp/wasm-bindings to 1.2.1

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
