# @xmtp/xmtp-js

## 13.0.3

### Patch Changes

- 1d71ebd: Add optional `err` parameter to `OnConnectionLostCallback`

## 13.0.2

### Patch Changes

- b81dbff: Fixed encryption dependency

## 13.0.1

### Patch Changes

- 760da4a: Allow larger page size and limit in the API client when querying consent

## 13.0.0

### Minor Changes

- d3b13b7:
  - Upgraded `@xmtp/proto` for encoding of a private preferences action map
  - Added a private preferences store to manage persisting of actions
  - Added new methods to `InMemoryKeystore` to interact with the private preferences store
  - Refactored `Contacts` class to use the private preferences store

### BREAKING CHANGES

- Removed deprecated `lastConsentListEntryTimestamp` method from `Contacts` class
- Changed return value of the `refreshConsentList` and `loadConsentList` methods of the `Contacts` class

## 12.1.0

### Minor Changes

- 9958ff1: Added allow and deny consent for groups and inboxes

## 12.0.1

### Patch Changes

- 4c0340b: Upgraded `@xmtp/proto` and `elliptic` dependencies

## 12.0.0

### Major Changes

- 9619322:
  - Removed internal content types and their primitives
  - Added content types and primitives from their respective packages
  - Removed `ContentTypeComposite`, see [XIP-19](https://community.xmtp.org/t/xip-19-deprecate-the-composite-codec/525) for more details
  - Removed `ContentTypeFallback`

### BREAKING CHANGES

With this update, the following are no longer exported from the JS SDK: `ContentTypeId`, `CodecRegistry`, `ContentCodec`, `EncodedContent`, `ContentTypeFallback`, `TextCodec`, `ContentTypeText`, `Composite`, `CompositeCodec`, `ContentTypeComposite`

For content type primitives, use the new `@xmtp/content-type-primitives` package. It exports `ContentTypeId`, `CodecRegistry`, `ContentCodec`, and `EncodedContent`.

The text content type and codec can now be found at `@xmtp/content-type-text`. It exports `ContentTypeText`, `Encoding`, and `TextCodec`.

## 11.6.3

### Patch Changes

- aec9641: Updated priorities on newConversation method

## 11.6.2

### Patch Changes

- dc7e2f0: Upgrade `@xmtp/consent-proof-signature` for CommonJS support
