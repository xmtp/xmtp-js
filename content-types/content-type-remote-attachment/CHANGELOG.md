# @xmtp/content-type-remote-attachment

## 2.0.2

### Patch Changes

- Updated dependencies [779fd0c]
  - @xmtp/content-type-primitives@2.0.2

## 2.0.1

### Patch Changes

- Updated dependencies [340fcf4]
  - @xmtp/content-type-primitives@2.0.1
  - @xmtp/proto@3.78.0
  - @noble/secp256k1@2.2.3

## 2.0.0

### Major Changes

- 1777a23: Dropped support for CommonJS

### Patch Changes

- Updated dependencies [1777a23]
  - @xmtp/content-type-primitives@2.0.0

## 1.1.12

### Patch Changes

- Updated dependencies [63e5276]
  - @xmtp/content-type-primitives@1.0.3

## 1.1.11

### Patch Changes

- b81dbff: Fixed encryption dependency

## 1.1.10

### Patch Changes

- 9addb1c:
  - Updated `AttachmentCodec` type to include parameters type
  - Added and exported `AttachmentParameters` type
  - Updated `RemoteAttachmentCodec` type to include parameters type
  - Added and exported `RemoteAttachmentParameters` type
- Updated dependencies [9addb1c]
  - @xmtp/content-type-primitives@1.0.2

## 1.1.9

### Patch Changes

- [#75](https://github.com/xmtp/xmtp-js-content-types/pull/75) [`da0bd85`](https://github.com/xmtp/xmtp-js-content-types/commit/da0bd8578d5f5032b221e25f02e8492b27929d6c)
  - Use primitives package for types

## 1.1.8

### Patch Changes

- [#65](https://github.com/xmtp/xmtp-js-content-types/pull/65) [`c4d43dc`](https://github.com/xmtp/xmtp-js-content-types/commit/c4d43dc948231de5c7f730e06f0931076de0673b)
  - Add `shouldPush` to all content codecs

## 1.1.7

### Patch Changes

- [#60](https://github.com/xmtp/xmtp-js-content-types/pull/60) [`5b9310a`](https://github.com/xmtp/xmtp-js-content-types/commit/5b9310ac89fd23e5cfd74903894073b6ef8af7c3)
  - Upgraded JS SDK to `11.3.12`

## 1.1.6

### Patch Changes

- [#54](https://github.com/xmtp/xmtp-js-content-types/pull/54) [`718cb9f`](https://github.com/xmtp/xmtp-js-content-types/commit/718cb9fec51f74bf2402f3f22160687cae35dda8)
  - Updated Turbo config to remove `generate:types` command and instead rely on `build`
  - Removed all `generate:types` commands from `package.json` files
  - Updated shared ESLint config and local ESLint configs
  - Updated `include` field of `tsconfig.json` and `tsconfig.eslint.json` files
  - Replaced `tsup` with `rollup`

## 1.1.5

### Patch Changes

- [#51](https://github.com/xmtp/xmtp-js-content-types/pull/51) [`aeb6db7`](https://github.com/xmtp/xmtp-js-content-types/commit/aeb6db73a63409a33c7d3d3431e33682b0ce4c4d)
  - Only publish files in the `/dist` directory

## 1.1.4

### Patch Changes

- Upgraded `@xmtp/proto` package
- Upgraded `@xmtp/xmtp-js` package

## 1.1.3

### Patch Changes

- Update `@xmtp/proto` to latest version

## 1.1.2

### Patch Changes

- Upgrade to JS SDK v11
- Update client initialization for tests to use `codecs` option for proper types

## 1.1.1

### Patch Changes

- fix: update the copy for the default fallbacks

## 1.1.0

### Minor Changes

- Add dummy fallback field to all content types
