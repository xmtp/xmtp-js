# Backend in Static Methods — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate both SDKs to use the `Backend`/`BackendBuilder` abstraction for all network calls, while maintaining backwards compatibility for existing callers.

**Architecture:** Create a `createBackend` utility that wraps `BackendBuilder`, refactor all static methods to accept `XmtpEnv | Backend` via an `envOrBackend` param, and update `Client.create`/`Client.build` to optionally accept a pre-built `Backend` via `ClientOptions`. Internally, always resolve to a `Backend` before calling bindings.

**Tech Stack:** TypeScript, @xmtp/node-bindings 1.10.0-dev.a2bdd0a, @xmtp/wasm-bindings 1.10.0-dev.a2bdd0a, Vitest

**Design doc:** `tasks/2026-02-25-use-backend-in-static-methods-design.md`

---

## Task 0: Fix bindings breakage (node-sdk)

The node-bindings 1.10.0-dev.a2bdd0a renamed several methods. bennycode/1.10 partially addressed these but some remain broken. Fix all typecheck errors that are **not** related to the Backend migration (those are handled in later tasks).

**Files:**

- Modify: `sdks/node-sdk/src/Client.ts:835` — `sendSyncRequest()` now on `DeviceSync` and requires `(ArchiveOptions, serverUrl)`
- Modify: `sdks/node-sdk/src/utils/createClient.ts:65` — `historySyncUrl` being passed where `SyncWorkerMode` expected (arg order change with `DbOptions`)

**Step 1: Fix `createClient.ts` — the `createClient` binding now uses `DbOptions`**

The old `createClient` binding in `a2bdd0a` takes: `(v3Host, gatewayHost, isSecure, dbPath, inboxId, identifier, encryptionKey, deviceSyncServerUrl, deviceSyncWorkerMode, logOptions, allowOffline, appVersion, nonce, ...)`

bennycode/1.10 already restructured `createClient.ts` to pass a `DbOptions` object at position 4, but the `a2bdd0a` bindings don't use `DbOptions` for the old `createClient` — they still take `dbPath` as a plain string. The error is that `historySyncUrl` is being passed in the `deviceSyncWorkerMode` slot.

Review the actual `createClient` signature from the bindings and fix the call accordingly. The old `createNodeClient` in `a2bdd0a` takes individual params, not `DbOptions`. Fix to match.

Run: `cd sdks/node-sdk && yarn typecheck`
Expected: `sendSyncRequest` error remains, `createClient.ts` and `inboxId.ts` errors gone (inboxId.ts error is Backend-related, handled in Task 2)

**Step 2: Fix `Client.ts:835` — `sendSyncRequest` signature change**

`sendSyncRequest()` moved to `client.deviceSync()` and now requires `(options: ArchiveOptions, serverUrl: string)`. This is a significant API change — the SDK's `sendSyncRequest()` method needs to accept these new params or be updated.

Check the node-sdk `Client.sendSyncRequest()` at line 830 and update it to match the new bindings signature. The method should accept `ArchiveOptions` and `serverUrl` and pass them through.

Run: `cd sdks/node-sdk && yarn typecheck`
Expected: Only Backend-related errors remain (lines 590, 609, 735, 798, 821 — all are `Expected N arguments` for free functions that now take `Backend`)

**Step 3: Run lint**

Run: `cd sdks/node-sdk && yarn lint`

**Step 4: Commit**

```
gt modify --commit -m "fix(node-sdk): update for bindings 1.10 method renames"
```

---

## Task 0b: Fix bindings breakage (browser-sdk)

Fix all non-Backend typecheck errors in the browser-sdk.

**Files:**

- Modify: `sdks/browser-sdk/src/index.ts:53` — `RemoteAttachmentInfo` → removed
- Modify: `sdks/browser-sdk/src/WorkerClient.ts:147` — `findInboxIdByIdentifier` → `findInboxIdByIdentity`
- Modify: `sdks/browser-sdk/src/WorkerClient.ts:189` — `sendSyncRequest` moved to DeviceSync
- Modify: `sdks/browser-sdk/src/WorkerConversation.ts:155-168` — `addMembers`/`removeMembers` renamed

**Step 1: Fix `index.ts` — remove `RemoteAttachmentInfo` export**

Remove `RemoteAttachmentInfo` from the type exports.

**Step 2: Fix `WorkerClient.ts:147` — `findInboxIdByIdentifier` → `findInboxIdByIdentity`**

Change `this.#client.findInboxIdByIdentifier(identifier)` to `this.#client.findInboxIdByIdentity(identifier)`.

**Step 3: Fix `WorkerClient.ts:189` — `sendSyncRequest` moved to DeviceSync**

Update to use `this.#client.device_sync().sendSyncRequest(options, serverUrl)`. This requires the same API change as node-sdk — accept `ArchiveOptions` and `serverUrl`.

**Step 4: Fix `WorkerConversation.ts:155-168` — member methods renamed**

```
// Old:                                    New:
this.#group.addMembers(identifiers)     → this.#group.addMembersByIdentity(identifiers)
this.#group.addMembersByInboxId(ids)    → this.#group.addMembers(ids)
this.#group.removeMembers(identifiers)  → this.#group.removeMembersByIdentity(identifiers)
this.#group.removeMembersByInboxId(ids) → this.#group.removeMembers(ids)
```

**Step 5: Run typecheck**

Run: `cd sdks/browser-sdk && yarn typecheck`
Expected: Only Backend-related errors remain (createClient.ts, inboxId.ts, inboxState.ts, installations.ts — all argument count mismatches for free functions that now take `Backend`)

**Step 6: Run lint**

Run: `cd sdks/browser-sdk && yarn lint`

**Step 7: Commit**

```
gt modify --commit -m "fix(browser-sdk): update for bindings 1.10 method renames"
```

---

## Task 1: Create `createBackend` utility and refactor types (node-sdk)

**Files:**

- Create: `sdks/node-sdk/src/utils/createBackend.ts`
- Modify: `sdks/node-sdk/src/types.ts`
- Modify: `sdks/node-sdk/src/index.ts`

**Step 1: Create `createBackend.ts`**

```typescript
import { BackendBuilder, type Backend } from "@xmtp/node-bindings";
import type { NetworkOptions } from "@/types";

export const createBackend = (options?: NetworkOptions): Backend => {
  const env = options?.env ?? "dev";
  const builder = new BackendBuilder(env);
  if (options?.apiUrl) builder.setApiUrl(options.apiUrl);
  if (options?.gatewayHost) builder.setGatewayHost(options.gatewayHost);
  if (options?.appVersion) builder.setAppVersion(options.appVersion);
  return builder.build();
};
```

**Step 2: Refactor `types.ts`**

- Move `appVersion` from `OtherOptions` to `NetworkOptions`
- Create `DeviceSyncOptions` with `historySyncUrl` (from `NetworkOptions`) and `disableDeviceSync` (from `OtherOptions`)
- Remove those fields from their old locations
- Update `ClientOptions` to be `(NetworkOptions | { backend: Backend }) & DeviceSyncOptions & StorageOptions & ContentOptions & OtherOptions`

**Step 3: Update `index.ts` exports**

- Add: `export { createBackend } from "./utils/createBackend"`
- Add: `Backend, BackendBuilder` to the exports from `@xmtp/node-bindings`
- Remove: `RemoteAttachmentInfo` (if not already done in Task 0)

**Step 4: Run typecheck (expect some errors from later tasks)**

Run: `cd sdks/node-sdk && yarn typecheck`

**Step 5: Write tests for `createBackend`**

Create `sdks/node-sdk/test/createBackend.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { createBackend } from "@/utils/createBackend";

describe("createBackend", () => {
  it("should create a backend with default options", () => {
    const backend = createBackend();
    expect(backend).toBeDefined();
    expect(backend.env).toBe("dev");
  });

  it("should create a backend with a specific env", () => {
    const backend = createBackend({ env: "production" });
    expect(backend.env).toBe("production");
  });

  it("should create a backend with a specific env and gateway host", () => {
    const backend = createBackend({
      env: "production",
      gatewayHost: "https://my-gateway.example.com",
    });
    expect(backend.env).toBe("production");
    expect(backend.gatewayHost).toBe("https://my-gateway.example.com");
  });

  it("should create a backend with appVersion", () => {
    const backend = createBackend({
      env: "dev",
      appVersion: "test/1.0.0",
    });
    expect(backend.appVersion).toBe("test/1.0.0");
  });

  it("should create a backend with apiUrl override", () => {
    const backend = createBackend({
      apiUrl: "https://custom-api.example.com:5558",
    });
    expect(backend).toBeDefined();
    expect(backend.v3Host).toBe("https://custom-api.example.com:5558");
  });
});
```

**Step 6: Run tests**

Run: `cd sdks/node-sdk && yarn vitest run test/createBackend.test.ts`
Expected: All tests pass

**Step 7: Commit**

```
gt modify --commit -m "feat(node-sdk): add createBackend utility and refactor types"
```

---

## Task 2: Update node-sdk utility functions to use Backend

**Files:**

- Modify: `sdks/node-sdk/src/utils/inboxId.ts`
- Modify: `sdks/node-sdk/src/utils/createClient.ts`

**Step 1: Update `inboxId.ts` — use `getInboxIdByIdentity` with Backend**

The binding is now `getInboxIdByIdentity(backend, identifier)`. Update `getInboxIdForIdentifier` to accept a `Backend` and pass it through.

```typescript
import {
  generateInboxId as generateInboxIdBinding,
  getInboxIdByIdentity,
  type Backend,
  type Identifier,
} from "@xmtp/node-bindings";

export const generateInboxId = (
  identifier: Identifier,
  nonce?: bigint,
): string => {
  return generateInboxIdBinding(identifier, nonce);
};

export const getInboxIdForIdentifier = async (
  backend: Backend,
  identifier: Identifier,
) => {
  return getInboxIdByIdentity(backend, identifier);
};
```

**Step 2: Update `createClient.ts` — use `createClientWithBackend`**

Replace the `createNodeClient(host, gatewayHost, isSecure, ...)` call with:

1. Build a `Backend` via `createBackend(options)`
2. Use `getInboxIdForIdentifier(backend, identifier)` for inbox ID resolution
3. Call `createClientWithBackend(backend, db, inboxId, identifier, ...)`

Add validation: if `options.backend` is provided, use it directly; if `NetworkOptions` fields are also set, throw an error.

**Step 3: Run typecheck**

Run: `cd sdks/node-sdk && yarn typecheck`
Expected: Errors only in `Client.ts` static methods (they still pass old args)

**Step 4: Commit**

```
gt modify --commit -m "feat(node-sdk): update utility functions to use Backend"
```

---

## Task 3: Update node-sdk static methods

**Files:**

- Modify: `sdks/node-sdk/src/Client.ts`

**Step 1: Update imports**

Replace imports of `inboxStateFromInboxIds` with `fetchInboxStatesByInboxIds`. Add `Backend` import. Import `createBackend` from utils.

**Step 2: Add `resolveBackend` helper (private, at top of Client class or as module-level function)**

```typescript
import { Backend } from "@xmtp/node-bindings";
import { createBackend } from "@/utils/createBackend";
import type { XmtpEnv } from "@/types";

const resolveBackend = (
  envOrBackend?: XmtpEnv | Backend,
  gatewayHost?: string,
): Backend => {
  if (envOrBackend instanceof Backend) {
    return envOrBackend;
  }
  return createBackend({ env: envOrBackend, gatewayHost });
};
```

**Step 3: Update `revokeInstallations`**

Change signature to `(signer, inboxId, installationIds, envOrBackend?, gatewayHost?)`.
Internally resolve backend and call `revokeInstallationsSignatureRequest(backend, identifier, inboxId, installationIds)` and `applySignatureRequest(backend, signatureRequest)`.

Add deprecation JSDoc on `envOrBackend` and `gatewayHost`.

**Step 4: Update `fetchInboxStates`**

Change signature to `(inboxIds, envOrBackend?, gatewayHost?)`.
Call `fetchInboxStatesByInboxIds(backend, inboxIds)`.

**Step 5: Update `canMessage`**

Change signature to `(identifiers, envOrBackend?)`.
Build backend once, pass to `getInboxIdForIdentifier(backend, identifier)` for each identifier.

**Step 6: Update `isAddressAuthorized`**

Change signature to `(inboxId, address, envOrBackend?, gatewayHost?)`.
Call `isAddressAuthorizedBinding(backend, inboxId, address)`.

**Step 7: Update `isInstallationAuthorized`**

Change signature to `(inboxId, installation, envOrBackend?, gatewayHost?)`.
Call `isInstallationAuthorizedBinding(backend, inboxId, installation)`.

**Step 8: Run typecheck**

Run: `cd sdks/node-sdk && yarn typecheck`
Expected: PASS (0 errors)

**Step 9: Run lint**

Run: `cd sdks/node-sdk && yarn lint`

**Step 10: Commit**

```
gt modify --commit -m "feat(node-sdk): update static methods to accept Backend"
```

---

## Task 4: Create `createBackend` utility and refactor types (browser-sdk)

**Files:**

- Create: `sdks/browser-sdk/src/utils/createBackend.ts`
- Modify: `sdks/browser-sdk/src/types/options.ts`
- Modify: `sdks/browser-sdk/src/index.ts`

**Step 1: Create `createBackend.ts`**

```typescript
import init, { BackendBuilder, type Backend } from "@xmtp/wasm-bindings";
import type { NetworkOptions } from "@/types/options";

export const createBackend = async (
  options?: NetworkOptions,
): Promise<Backend> => {
  await init();
  const env = options?.env ?? "dev";
  const builder = new BackendBuilder(env);
  if (options?.apiUrl) builder.setApiUrl(options.apiUrl);
  if (options?.gatewayHost) builder.setGatewayHost(options.gatewayHost);
  if (options?.appVersion) builder.setAppVersion(options.appVersion);
  return builder.build();
};
```

Note: browser-sdk requires `await init()` before using wasm bindings, so `createBackend` must be async.

**Step 2: Refactor `types/options.ts`**

Same pattern as node-sdk:

- Move `appVersion` from `OtherOptions` to `NetworkOptions`
- Create `DeviceSyncOptions` with `historySyncUrl` (from `NetworkOptions`) and `disableDeviceSync` (from `OtherOptions`)
- Update `ClientOptions` to be `(NetworkOptions | { backend: Backend }) & DeviceSyncOptions & StorageOptions & ContentOptions & OtherOptions`

**Step 3: Update `index.ts` exports**

- Add: `export { createBackend } from "./utils/createBackend"`
- Add: `Backend, BackendBuilder` to the wasm-bindings exports
- Remove: `RemoteAttachmentInfo` (if not already done in Task 0b)

**Step 4: Write tests for `createBackend`**

Create `sdks/browser-sdk/test/createBackend.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { createBackend } from "@/utils/createBackend";

describe("createBackend", () => {
  it("should create a backend with default options", async () => {
    const backend = await createBackend();
    expect(backend).toBeDefined();
    expect(backend.env).toBe("dev");
  });

  it("should create a backend with a specific env", async () => {
    const backend = await createBackend({ env: "production" });
    expect(backend.env).toBe("production");
  });

  it("should create a backend with a specific env and gateway host", async () => {
    const backend = await createBackend({
      env: "production",
      gatewayHost: "https://my-gateway.example.com",
    });
    expect(backend.env).toBe("production");
    expect(backend.gatewayHost).toBe("https://my-gateway.example.com");
  });

  it("should create a backend with appVersion", async () => {
    const backend = await createBackend({
      env: "dev",
      appVersion: "test/1.0.0",
    });
    expect(backend.appVersion).toBe("test/1.0.0");
  });

  it("should create a backend with apiUrl override", async () => {
    const backend = await createBackend({
      apiUrl: "https://custom-api.example.com:5558",
    });
    expect(backend).toBeDefined();
    expect(backend.v3Host).toBe("https://custom-api.example.com:5558");
  });
});
```

Note: browser-sdk `createBackend` is async (requires `await init()`), so all tests use `async/await`.

**Step 5: Run tests**

Run: `cd sdks/browser-sdk && yarn vitest run test/createBackend.test.ts`
Expected: All tests pass

**Step 6: Commit**

```
gt modify --commit -m "feat(browser-sdk): add createBackend utility and refactor types"
```

---

## Task 5: Update browser-sdk utility functions to use Backend

**Files:**

- Modify: `sdks/browser-sdk/src/utils/inboxId.ts`
- Modify: `sdks/browser-sdk/src/utils/inboxState.ts`
- Modify: `sdks/browser-sdk/src/utils/installations.ts`
- Modify: `sdks/browser-sdk/src/utils/createClient.ts`

**Step 1: Update `inboxId.ts`**

The wasm binding is now `getInboxIdForIdentifier(backend, identifier)`. Update the utility to accept `Backend`.

**Step 2: Update `inboxState.ts`**

The wasm binding is now `inboxStateFromInboxIds(backend, inboxIds)`. Update to accept `Backend`.

**Step 3: Update `installations.ts`**

`revokeInstallationsSignatureRequest` is now `(backend, identifier, inboxId, installationIds)`.
`applySignatureRequest` is now `(backend, signatureRequest)`.
Update both `revokeInstallationsSignatureText` and `revokeInstallations` to accept `Backend`.

**Step 4: Update `createClient.ts`**

- Replace `DeviceSyncWorkerMode` import with `DeviceSyncMode`
- Build a `Backend` via `createBackend(options)` (or use `options.backend` if provided)
- Use `getInboxIdForIdentifier(backend, identifier)` (just 2 args now)
- Call `createClientWithBackend(backend, inboxId, identifier, ...)` instead of `createWasmClient(host, ...)`
- Add validation: throw if both `backend` and `NetworkOptions` fields are set

**Step 5: Run typecheck**

Run: `cd sdks/browser-sdk && yarn typecheck`
Expected: Only errors in `Client.ts` static methods (if any)

**Step 6: Commit**

```
gt modify --commit -m "feat(browser-sdk): update utility functions to use Backend"
```

---

## Task 6: Update browser-sdk static methods

**Files:**

- Modify: `sdks/browser-sdk/src/Client.ts`

**Step 1: Update `revokeInstallations`**

Change signature to `(signer, inboxId, installationIds, envOrBackend?, gatewayHost?)`.
Build backend, pass to `utilsRevokeInstallations`. This means `utilsRevokeInstallations` must also accept `Backend` (done in Task 5).

**Step 2: Update `fetchInboxStates`**

Change signature to `(inboxIds, envOrBackend?, gatewayHost?)`.
Build backend, pass to `utilsInboxStateFromInboxIds`.

**Step 3: Update `canMessage`**

Change signature to `(identifiers, envOrBackend?)`.
Build backend, pass to `getInboxIdForIdentifier`.

**Step 4: Add deprecation JSDoc on all updated parameters**

**Step 5: Run typecheck**

Run: `cd sdks/browser-sdk && yarn typecheck`
Expected: PASS (0 errors)

**Step 6: Run lint**

Run: `cd sdks/browser-sdk && yarn lint`

**Step 7: Commit**

```
gt modify --commit -m "feat(browser-sdk): update static methods to accept Backend"
```

---

## Task 7: Run full test suite

**Files:** Tests in both SDKs

**Impacted test files:**

- `sdks/node-sdk/test/Client.test.ts` — tests for `revokeInstallations`, `fetchInboxStates`, `canMessage`, `isAddressAuthorized`, `isInstallationAuthorized`, `sendSyncRequest`
- `sdks/node-sdk/test/helpers.ts` — `createClient`, `buildClient` helpers use `ClientOptions`
- `sdks/node-sdk/test/inboxId.test.ts` — tests for `getInboxIdForIdentifier`
- `sdks/browser-sdk/test/Client.test.ts` — tests for `revokeInstallations`, `fetchInboxStates`, `canMessage`
- `sdks/browser-sdk/test/helpers.ts` — `createClient`, `buildClient` helpers use `ClientOptions`
- `sdks/browser-sdk/test/inboxId.test.ts` — tests for `getInboxIdForIdentifier`

**Step 1: Ensure test:setup is running**

Run: `yarn test:setup`

**Step 2: Run node-sdk tests**

Run: `cd sdks/node-sdk && yarn test`

Fix any failures. Common issues:

- Test helpers may need to use `createBackend` for the `env` they pass
- Static method calls in tests that pass `env` should still work (backwards compat)

**Step 3: Run browser-sdk tests**

Run: `cd sdks/browser-sdk && yarn test`

Fix any failures.

**Step 4: Run full build**

Run: `yarn build`

**Step 5: Run full lint**

Run: `yarn lint`

**Step 6: Commit any test fixes**

```
gt modify --commit -m "test: update tests for Backend migration"
```

---

## Task 8: Update READMEs

**Files:**

- Modify: `sdks/node-sdk/README.md`
- Modify: `sdks/browser-sdk/README.md`

**Step 1: Add Backend usage section to both READMEs**

Show:

- How to create a `Backend` with `createBackend()`
- How to pass it to static methods
- How to pass it via `ClientOptions`
- Deprecation notice for `env`/`gatewayHost` params

**Step 2: Commit**

```
gt modify --commit -m "docs: update READMEs with Backend usage"
```

---

## Task 9: Final verification

**Step 1: Full typecheck**

Run: `yarn typecheck`

**Step 2: Full lint**

Run: `yarn lint`

**Step 3: Full build**

Run: `yarn build`

**Step 4: Restack and submit**

```
gt restack
gt submit --stack --update-only
```
