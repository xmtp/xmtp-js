# @xmtp/xmtp-js

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
