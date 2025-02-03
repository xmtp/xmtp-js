# XMTP client SDK for Node

This package provides the XMTP client SDK for Node.

To keep up with the latest SDK developments, see the [Issues tab](https://github.com/xmtp/xmtp-js/issues) in this repo.

To learn more about XMTP and get answers to frequently asked questions, see the [XMTP documentation](https://xmtp.org/docs).

> [!CAUTION]
> This SDK is in beta status and ready for you to build with in production. Software in this status may change based on feedback.

## Requirements

- Node.js 20+
- `glibc` 3.28+ (i.e. Ubuntu 24.04 or later)

## Install

**NPM**

```bash
npm install @xmtp/node-sdk
```

**PNPM**

```bash
pnpm install @xmtp/node-sdk
```

**Yarn**

```bash
yarn add @xmtp/node-sdk
```

## XMTP network environments

XMTP provides `production`, `dev`, and `local` network environments to support the development phases of your project. To learn more about these environments, see our [official documentation](https://xmtp.org/docs/build/authentication#environments).

## Developing

Run `yarn dev` to build the SDK and watch for changes, which will trigger a rebuild.

### Useful commands

- `yarn build`: Builds the SDK
- `yarn clean`: Removes `node_modules`, `dist`, and `.turbo` folders
- `yarn test`: Runs all tests
- `yarn typecheck`: Runs `tsc`
