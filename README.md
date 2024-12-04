# XMTP TypeScript

This is the official repository for XMTP client SDKs, content types, and packages, written in TypeScript and powered by [Turborepo](https://turbo.build/repo).

To learn more about the contents of this repository, see this README and the READMEs provided in each workspace directory.

## What's inside?

### SDKs

- [`node-sdk`](https://github.com/xmtp/xmtp-js/blob/main/sdks/node-sdk): XMTP client SDK for Node (V3 only)
- [`browser-sdk`](https://github.com/xmtp/xmtp-js/blob/main/sdks/browser-sdk): XMTP client SDK for browsers (V3 only)

### Content types

- [`content-type-primitives`](content-types/content-type-primitives): Primitives for building custom XMTP content types
- [`content-type-reaction`](content-types/content-type-reaction): Content type for reactions to messages
- [`content-type-read-receipt`](content-types/content-type-read-receipt): Content type for read receipts for messages
- [`content-type-remote-attachment`](content-types/content-type-remote-attachment): Content type for sending file attachments that are stored off-network
- [`content-type-reply`](content-types/content-type-reply): Content type for direct replies to messages
- [`content-type-text`](content-types/content-type-text): Content type for plain text messages
- [`content-type-transaction-reference`](content-types/content-type-transaction-reference): Content type for on-chain transaction references

### Packages

- [`consent-proof-signature`](https://github.com/xmtp/xmtp-js/blob/main/packages/consent-proof-signature): Lightweight package for creating consent proofs
- [`frames-client`](https://github.com/xmtp/xmtp-js/blob/main/packages/frames-client): XMTP Open Frames client
- [`frames-validator`](https://github.com/xmtp/xmtp-js/blob/main/packages/frames-validator): Tools for validating POST payloads from XMTP Open Frames

## Contributing

See our [contribution guide](./CONTRIBUTING.md) to learn more about contributing to this project.
