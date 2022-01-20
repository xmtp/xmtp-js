# XMTP Client Crypto

Cryptographic classes and utilities for use in XMTP client libraries.

Provided primitives are built around the standard Web Crypto API and the @noble libraries.
The funcionality includes:

* EC Public/Private Keys (secp256k1)
* ECDSA signatures and signing of public keys
* shared secret derivation (ECDH)
* authenticated symmetric encryption (AEAD: AES-256-GCM)
* symmetric key derivation (HKDF-SHA-256)
* X3DH key bundles
* protobuf based serialization

## Installation

For NPM users:
`npm install @xmtp-org/xmtp-client-crypto`

For Yarn or PNPM users:
`<yarn/pnpm> add @xmtp-org/xmtp-client-crypto`

## Usage

@TODO: in the meantime the test suite provides examples of usage

## API methods

| Method name | Description | Params | Returns | Errors |
| ----------- | ----------- | ------ | ------- | ------ |
|             |             |        |         |        |
|             |             |        |         |        |
|             |             |        |         |        |

## Developing

Before committing your time to code, please read the [CONTRIBUTING.md document](https://github.com/xmtp-org/xmtp-js-sdk/blob/main/CONTRIBUTING.md).

To build the project, run: `pnpm build`. This compiles the TypeScript source to JS via Babel.
Test and view coverage information: `pnpm coverage`

## TODO

* split index.ts into smaller files
* decoded keys/messages have Buffers instead of Uint8Arrays; problem?
* private key/bundle serialization
* add message timestamp
* add key timestamp
* sanity checking to avoid common mistakes
* wiping of sensitive material
* document the protobuf setup/requirements/development flow
* document the design decisions
   * basic api flows/usage
   * protobuf message structure (algorithm agility)
