# @xmtp/browser-sdk

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
