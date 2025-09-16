# XMTP client SDK for Node

This package provides the XMTP client SDK for Node.

To keep up with the latest SDK developments, see the [Issues tab](https://github.com/xmtp/xmtp-js/issues) in this repo.

> [!CAUTION]
> This SDK is in beta status and ready for you to build with in production. Software in this status may change based on feedback.

## Documentation

To learn how to use the XMTP client SDK for Node, see [Get started with the XMTP Node SDK](https://docs.xmtp.org/sdks/node).

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

## Developing

Run `yarn dev` to build the SDK and watch for changes, which will trigger a rebuild.

## Testing

For testing setup instructions, see our [testing guidelines](https://github.com/xmtp/xmtp-js/blob/main/CONTRIBUTING.md#testing) in the main repository.

### Useful commands

- `yarn build`: Builds the SDK
- `yarn clean`: Removes `node_modules`, `dist`, and `.turbo` folders
- `yarn test`: Runs all tests
- `yarn typecheck`: Runs `tsc`

## Breaking revisions

Because this SDK is in active development, you should expect breaking revisions that might require you to adopt the latest SDK release to enable your app to continue working as expected.

Breaking revisions in a Node SDK release are described on the [Releases page](https://github.com/xmtp/xmtp-js/releases).

## Deprecation

Older versions of the SDK will eventually be deprecated, which means:

1. The network will not support and eventually actively reject connections from clients using deprecated versions.
2. Bugs will not be fixed in deprecated versions.

The following table provides the deprecation schedule.

| Announced                   | Effective   | Minimum Version | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------- | ----------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No more support for XMTP V2 | May 1, 2025 | >=1.0.5         | In a move toward better security with MLS and the ability to decentralize, we will be shutting down XMTP V2 and moving entirely to XMTP V3. To learn more about V2 deprecation, see [XIP-53: XMTP V2 deprecation plan](https://community.xmtp.org/t/xip-53-xmtp-v2-deprecation-plan/867). To learn how to upgrade, see [@xmtp/node-sdk v1.0.5](https://github.com/xmtp/xmtp-js/releases/tag/%40xmtp%2Fnode-sdk%401.0.5). |

Bug reports, feature requests, and PRs are welcome in accordance with these [contribution guidelines](https://github.com/xmtp/xmtp-js/blob/main/CONTRIBUTING.md).
