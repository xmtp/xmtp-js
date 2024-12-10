# @xmtp/frames-client

## 1.0.1

### Patch Changes

- 1777a23: Dropped support for CommonJS
  - @xmtp/xmtp-js@13.0.5

## 1.0.0

### BREAKING CHANGE

- 86a8f9f: Refactored signing process using a new `FramesSigner` type

The `FramesClient` class now accepts a `FramesSigner` that handles signing of the frame actions. It supports both V2 and V3 signers.

```ts
type V2FramesSigner = {
  address: () => Promise<string> | string;
  getPublicKeyBundle: () => Promise<publicKeyProto.PublicKeyBundle>;
  sign: (message: Uint8Array) => Promise<signatureProto.Signature>;
};

type V3FramesSigner = {
  installationId: () => Promise<Uint8Array> | Uint8Array;
  inboxId: () => Promise<string> | string;
  address: () => Promise<string> | string;
  sign: (message: Uint8Array) => Promise<Uint8Array> | Uint8Array;
};

type FramesSigner = V2FramesSigner | V3FramesSigner;
```

## 0.5.5

### Patch Changes

- 63e5276: Updated exports

## 0.5.4

### Patch Changes

- 3fc5b82: Upgraded dependencies

## 0.5.3

### Patch Changes

- 815ef8f: fix for transaction id

## 0.5.2

### Patch Changes

- 7db2728: adds transactionId to type

## 0.5.1

### Patch Changes

- 3ffc491: bumped packages to pass postUrl through in frameInfo

## 0.5.0

### Minor Changes

- e1ac826: add postTransaction support

## 0.4.3

### Patch Changes

- cab6fb3: Add support for the state field

## 0.4.2

### Patch Changes

- d01544d: Add support for optional inputText

## 0.4.1

### Patch Changes

- f822a36: Upgrade to 0.2.0 of the Frames Proxy client

## 0.4.0

### Minor Changes

- 893bf17: Use new Frames Proxy with support for frameInfo field

## 0.3.2

### Patch Changes

- b8297be: Add more exports

## 0.3.1

### Patch Changes

- 71cb3a3: Fix bug with identity key translation

## 0.3.0

### Minor Changes

- 65a7cc1: Add new Frames Proxy service and support for redirects and image URLs

## 0.2.2

### Patch Changes

- c323d3b: Makes the payloads Open Frames compatible and allows overriding the OG proxy URL

## 0.2.1

### Patch Changes

- 3bbf05c: updated readme

## 0.2.0

### Minor Changes

- b955667: Updates to the latest format of the proto message and tries to make safe for RN usage

## 0.1.4

### Patch Changes

- 8b21c05: Updated crypto imports, build, and exports

## 0.1.3

### Patch Changes

- 4c735d0: Add dynamic crypto import

## 0.1.2

### Patch Changes

- aa1cc83: Fix polyfill for webcrypto in Node.js

## 0.1.1

### Patch Changes

- fd952ee: Adds ability to post frame to a destination and see an updated response

## 0.1.0

### Minor Changes

- a04afac: Add support for preparing signed payloads for the Frames API
- 502c402: Initialize Frames Client
