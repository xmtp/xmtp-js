---
"@xmtp/browser-sdk": major
---

### BREAKING CHANGES

- Refactored `Client` constructor to only accept an options parameter
- Removed `encryptionKey` parameter from `Client.create`
- Removed `Opfs` export

### Other changes

- Upgraded `@xmtp/wasm-bindings` dependency
- Refactored static `Client.canMessage` to use `getInboxIdForIdentifier`
- Added `changeRecoveryIdentifier` to `Client`
- Added `getKeyPackageStatusesForInstallationIds`
- Added `getHmacKeys` to `Conversation`
- Updated `ClientOptions.dbPath` to allow `null` value
- Added static `Client.build` method to create a client without a signer
- Added custom error types
- Refactored utils worker
- Added code comments
- Updated `xmtp.chat` to always use the latest workspace dependencies
- Refactored `xmtp.chat` using updated browser SDK
- Added `dbEncryptionKey` to client options
