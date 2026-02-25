# Design: Use Backend in Static Methods & Client Creation

## Problem

Static methods across both SDKs accept raw `env` and `gatewayHost` parameters. The new bindings (node-bindings & wasm-bindings 1.10.0-dev.a2bdd0a) introduce a `Backend` + `BackendBuilder` abstraction that encapsulates all API configuration. We need to migrate to this pattern while maintaining backwards compatibility.

## Constraints

- **No breaking changes** — existing callers using `env`/`gatewayHost` must continue to work.
- **Deprecation path** — `env`/`gatewayHost` on static methods are deprecated in favor of `Backend`.
- **Backend is authoritative** — when a `Backend` is provided, no `NetworkOptions` fields may be specified alongside it.

## New Public API: `createBackend`

Exported from each SDK. Takes `NetworkOptions`, returns a `Backend`.

```typescript
import { BackendBuilder, type Backend } from "@xmtp/node-bindings";

export const createBackend = (options?: NetworkOptions): Backend => {
  const env = options?.env ?? "dev";
  const builder = new BackendBuilder(env);
  if (options?.apiUrl) builder.setApiUrl(options.apiUrl);
  if (options?.gatewayHost) builder.setGatewayHost(options.gatewayHost);
  if (options?.appVersion) builder.setAppVersion(options.appVersion);
  return builder.build();
};
```

## Type Refactoring

### `NetworkOptions` — gains `appVersion`, loses `historySyncUrl`

```typescript
type NetworkOptions = {
  env?: XmtpEnv;
  apiUrl?: string;
  gatewayHost?: string;
  appVersion?: string;
};
```

### New `DeviceSyncOptions`

```typescript
type DeviceSyncOptions = {
  historySyncUrl?: string | null;
  disableDeviceSync?: boolean;
};
```

### `OtherOptions` — loses `appVersion` and `disableDeviceSync`

```typescript
type OtherOptions = {
  structuredLogging?: boolean;
  loggingLevel?: LogLevel;
  disableAutoRegister?: boolean;
  nonce?: bigint;
};
```

### `ClientOptions` — union with backend

```typescript
type ClientOptions = (NetworkOptions | { backend: Backend }) &
  DeviceSyncOptions &
  StorageOptions &
  ContentOptions &
  OtherOptions;
```

Runtime validation: if `backend` is present, throw if any of `env`, `apiUrl`, `gatewayHost`, or `appVersion` are also set.

## Static Method Signatures (Backwards Compatible)

All static methods that currently take `env?: XmtpEnv` are updated to `envOrBackend?: XmtpEnv | Backend`. Methods that also take `gatewayHost` keep it but mark it deprecated.

### Node SDK

| Method                     | New Signature                                                     |
| -------------------------- | ----------------------------------------------------------------- |
| `revokeInstallations`      | `(signer, inboxId, installationIds, envOrBackend?, gatewayHost?)` |
| `fetchInboxStates`         | `(inboxIds, envOrBackend?, gatewayHost?)`                         |
| `canMessage`               | `(identifiers, envOrBackend?)`                                    |
| `isAddressAuthorized`      | `(inboxId, address, envOrBackend?, gatewayHost?)`                 |
| `isInstallationAuthorized` | `(inboxId, installation, envOrBackend?, gatewayHost?)`            |

### Browser SDK

| Method                | New Signature                                                     |
| --------------------- | ----------------------------------------------------------------- |
| `revokeInstallations` | `(signer, inboxId, installationIds, envOrBackend?, gatewayHost?)` |
| `fetchInboxStates`    | `(inboxIds, envOrBackend?, gatewayHost?)`                         |
| `canMessage`          | `(identifiers, envOrBackend?)`                                    |

### Internal resolution

Each method resolves a `Backend` internally:

```typescript
const backend =
  envOrBackend instanceof Backend
    ? envOrBackend
    : createBackend({ env: envOrBackend, gatewayHost });
```

### Deprecation annotations

```typescript
/**
 * @param envOrBackend - A `Backend` instance, or an `XmtpEnv` string.
 * @deprecated Passing `XmtpEnv` is deprecated. Pass a `Backend` instance
 * created with `createBackend()` instead. In a future release, only
 * `Backend` will be accepted.
 */

/**
 * @param gatewayHost - Gateway host override.
 * @deprecated Configure gateway host via `createBackend({ gatewayHost })`
 * instead. This parameter will be removed in a future release.
 */
```

## Client.create / Client.build — Backend Support

Both methods already accept `ClientOptions`. Internally:

1. If `options.backend` is present, validate no `NetworkOptions` fields are set.
2. If `options.backend` is present, use it directly.
3. Otherwise, build a backend from `NetworkOptions` via `createBackend()`.
4. Always use `createClientWithBackend(backend, ...)` — the old `createClient` binding is no longer called.

## Utility Function Updates

Underlying utility functions are updated to accept `Backend` instead of raw `env`/`host`/`isSecure`/`gatewayHost` params:

- `getInboxIdForIdentifier` / `getInboxIdByIdentity` — `(backend, identifier)`
- `inboxStateFromInboxIds` / `fetchInboxStatesByInboxIds` — `(backend, inboxIds)`
- `revokeInstallationsSignatureRequest` — `(backend, ...)`
- `applySignatureRequest` — `(backend, ...)`
- `isAddressAuthorized` — `(backend, inboxId, address)` (node only)
- `isInstallationAuthorized` — `(backend, inboxId, installationId)` (node only)

## Additional Bindings Changes (non-Backend)

The 1.10.0-dev.a2bdd0a bindings also include these renames/changes that must be fixed:

### Node SDK (node-bindings)

**Client class:**

- `getKeyPackageStatusesForInstallationIds` → `fetchKeyPackageStatusesByInstallationIds`
- `findInboxIdByIdentifier` → `getInboxIdByIdentity`
- `addressesFromInboxId(refreshFromNetwork, inboxIds)` → `fetchInboxStatesByInboxIds(inboxIds, refreshFromNetwork)` (args swapped)
- `syncPreferences()` moved from Client to Conversations
- `sendSyncRequest()` moved from Client to `client.deviceSync().sendSyncRequest(options, serverUrl)` — now requires `ArchiveOptions` and `serverUrl`

**Conversation class:**

- `getHmacKeys()` → `hmacKeys()`
- `findEnrichedMessages()` → `listEnrichedMessages()`
- `getLastReadTimes()` → `lastReadTimes()`
- `adminList()` → `listAdmins()`
- `superAdminList()` → `listSuperAdmins()`
- `addMembersByInboxId()` → `addMembers()` (takes `string[]`)
- `removeMembersByInboxId()` → `removeMembers()` (takes `string[]`)
- `addMembers(identities)` → `addMembersByIdentity(identities)` (takes `Identifier[]`)
- `removeMembers(identities)` → `removeMembersByIdentity(identities)` (takes `Identifier[]`)
- `findDuplicateDms()` → `duplicateDms()`

**Conversations class:**

- `findGroupById()` → `getConversationById()`
- `findDmByTargetInboxId()` → `getDmByInboxId()`
- `findEnrichedMessageById()` → `getEnrichedMessageById()`
- `createGroupByInboxId()` → `createGroup()` (takes `string[]`)
- `createGroup(identities)` → `createGroupByIdentity(identities)` (takes `Identifier[]`)
- `createDmByInboxId()` → `createDm()` (takes `string`)
- `createDm(identity)` → `createDmByIdentity(identity)` (takes `Identifier`)
- `syncAllConversations()` → `syncAll()`
- `getHmacKeys()` → `hmacKeys()`

**Free functions:**

- `inboxStateFromInboxIds` → `fetchInboxStatesByInboxIds`
- `getInboxIdForIdentifier` → `getInboxIdByIdentity`

**Exports:**

- `RemoteAttachmentInfo` removed — use `RemoteAttachment`

**createClient signature:**

- Now takes `DbOptions` object instead of separate `dbPath`/`encryptionKey` params

### Browser SDK (wasm-bindings)

**Client class:**

- `findInboxIdByIdentifier` → `findInboxIdByIdentity`
- `sendSyncRequest` moved from Client to `client.deviceSync().sendSyncRequest(options, serverUrl)`

**Conversation class:**

- `addMembersByInboxId()` → `addMembers()` (takes `string[]`)
- `removeMembersByInboxId()` → `removeMembers()` (takes `string[]`)

**Free functions:**

- `DeviceSyncWorkerMode` → `DeviceSyncMode`
- `getInboxIdForIdentifier(host, gatewayHost, isSecure, identifier)` → `getInboxIdForIdentifier(backend, identifier)`
- `inboxStateFromInboxIds(host, gatewayHost, inboxIds)` → `inboxStateFromInboxIds(backend, inboxIds)`
- `revokeInstallationsSignatureRequest` now takes `(backend, ...)` instead of `(host, gatewayHost, ...)`
- `applySignatureRequest` now takes `(backend, ...)` instead of `(host, gatewayHost, ...)`

**Exports:**

- `RemoteAttachmentInfo` removed — use `RemoteAttachment`

**createClient signature:**

- Old `createClient` still exists but `createClientWithBackend` is the preferred path

## Impacted Files

### Node SDK

- `sdks/node-sdk/src/types.ts` — type refactoring
- `sdks/node-sdk/src/Client.ts` — static methods + create/build + instance method renames
- `sdks/node-sdk/src/Conversation.ts` — method renames
- `sdks/node-sdk/src/Conversations.ts` — method renames
- `sdks/node-sdk/src/Dm.ts` — method renames
- `sdks/node-sdk/src/Group.ts` — method renames
- `sdks/node-sdk/src/Preferences.ts` — method renames (already partially done by bennycode/1.10)
- `sdks/node-sdk/src/utils/createClient.ts` — use `createClientWithBackend`
- `sdks/node-sdk/src/utils/inboxId.ts` — accept `Backend`
- `sdks/node-sdk/src/utils/createBackend.ts` — **new file**
- `sdks/node-sdk/src/index.ts` — export `createBackend`, `Backend`, `BackendBuilder`; remove `RemoteAttachmentInfo`

### Browser SDK

- `sdks/browser-sdk/src/types/options.ts` — type refactoring
- `sdks/browser-sdk/src/Client.ts` — static methods + create/build
- `sdks/browser-sdk/src/utils/createClient.ts` — use `createClientWithBackend`
- `sdks/browser-sdk/src/utils/inboxId.ts` — accept `Backend`
- `sdks/browser-sdk/src/utils/installations.ts` — accept `Backend`
- `sdks/browser-sdk/src/utils/inboxState.ts` — accept `Backend`
- `sdks/browser-sdk/src/WorkerClient.ts` — method renames
- `sdks/browser-sdk/src/WorkerConversation.ts` — method renames
- `sdks/browser-sdk/src/utils/createBackend.ts` — **new file**
- `sdks/browser-sdk/src/index.ts` — export `createBackend`, `Backend`, `BackendBuilder`; remove `RemoteAttachmentInfo`

## README Updates

Both SDK READMEs updated to show:

- How to create a `Backend` with `createBackend()`
- How to pass it to static methods
- How to pass it via `ClientOptions`
- Deprecation notice for `env`/`gatewayHost` params on static methods
