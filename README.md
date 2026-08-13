> [!IMPORTANT]
> **XMTP SDK development has moved.** The `agent-sdk`, `node-sdk`, and `browser-sdk` packages now live in [`xmtp/libxmtp`](https://github.com/xmtp/libxmtp) under [`sdks/js/`](https://github.com/xmtp/libxmtp/tree/main/sdks/js) and are built and released from there. Please file SDK issues and open SDK pull requests at [`xmtp/libxmtp`](https://github.com/xmtp/libxmtp/issues).
>
> This repository remains active and continues to host the `@xmtp/content-type-*` packages, the [xmtp.chat](https://xmtp.chat/) app, and `xmtp-cli`.

This repository hosts XMTP content types, the [xmtp.chat](https://xmtp.chat/) web app, and `xmtp-cli`, written in TypeScript. The XMTP JavaScript/TypeScript SDKs now live in [`xmtp/libxmtp`](https://github.com/xmtp/libxmtp).

To learn more about the contents of this repository, see this README and the READMEs provided in each workspace directory.

## Which SDK should I use?

XMTP offers SDKs for a variety of use cases. Whether you're building a chat app, an automated agent, or a custom messaging backend, there's an SDK for you. This guide will help you get started developing with JavaScript or TypeScript.

- **Browser SDK**: Use this if you want to build a **complete messaging web app** (like [xmtp.chat](https://xmtp.chat/)). Runs entirely in the browser using WASM and Web Workers.
- **Node SDK**: Use this if you want to build a **messaging CLI** or have **custom use cases beyond a chatbot/agent**.
- **Agent SDK**: Use this if you want to create a **bot that runs on a server** and replies to people messaging it. Built on top of the Node SDK with an event-driven middleware architecture.

## What's inside?

### Apps

- [`xmtp.chat`](apps/xmtp.chat): A [web app for developers](https://xmtp.chat/) to experiment with XMTP
- [`xmtp.chat-api-service`](apps/xmtp.chat-api-service/): An API to use [Pinata's file storage](https://pinata.cloud/)

### SDKs

The XMTP SDKs have moved to [`xmtp/libxmtp`](https://github.com/xmtp/libxmtp):

- [`agent-sdk`](https://github.com/xmtp/libxmtp/tree/main/sdks/js/agent-sdk): XMTP agent SDK for Node
- [`browser-sdk`](https://github.com/xmtp/libxmtp/tree/main/sdks/js/browser-sdk): XMTP client SDK for browsers
- [`node-sdk`](https://github.com/xmtp/libxmtp/tree/main/sdks/js/node-sdk): XMTP client SDK for Node

### Content types

- [`content-type-primitives`](content-types/content-type-primitives): Primitives for building custom XMTP content types
- [`content-type-group-updated`](content-types/content-type-group-updated): Content type for group update messages
- [`content-type-reaction`](content-types/content-type-reaction): Content type for reactions to messages
- [`content-type-read-receipt`](content-types/content-type-read-receipt): Content type for read receipts for messages
- [`content-type-remote-attachment`](content-types/content-type-remote-attachment): Content type for sending file attachments that are stored off-network
- [`content-type-reply`](content-types/content-type-reply): Content type for direct replies to messages
- [`content-type-text`](content-types/content-type-text): Content type for plain text messages
- [`content-type-transaction-reference`](content-types/content-type-transaction-reference): Content type for on-chain transaction references

## Contributing

See our [contribution guide](./CONTRIBUTING.md) to learn more about contributing to this project.
