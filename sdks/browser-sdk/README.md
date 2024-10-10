# React XMTP client SDK

![Status](https://img.shields.io/badge/Project_Status-Production-brightgreen)

This package provides the XMTP client SDK for React.

To keep up with the latest SDK developments, see the [Issues tab](https://github.com/xmtp/xmtp-web/issues) in this repo.

To learn more about XMTP and get answers to frequently asked questions, see the [XMTP documentation](https://xmtp.org/docs).

## What's inside?

### Hooks

These hooks are mostly bindings to the [`xmtp-js` SDK](https://github.com/xmtp/xmtp-js) that expose the underlying data in a React way.

## Requirements

- Node 18+
- React 16.14+

## Install

The XMTP React SDK requires React, the XMTP JS SDK, and several content types.

**NPM**

```bash
npm install react @xmtp/react-sdk @xmtp/xmtp-js @xmtp/content-type-reaction @xmtp/content-type-remote-attachment @xmtp/content-type-reply
```

**PNPM**

```bash
pnpm install react @xmtp/react-sdk @xmtp/xmtp-js @xmtp/content-type-reaction @xmtp/content-type-remote-attachment @xmtp/content-type-reply
```

**Yarn**

```bash
yarn add react @xmtp/react-sdk @xmtp/xmtp-js @xmtp/content-type-reaction @xmtp/content-type-remote-attachment @xmtp/content-type-reply
```

### Buffer polyfill

If you run into issues with Buffer and polyfills, see this [solution](https://xmtp.org/docs/faq#why-is-my-app-failing-with-a-buffer-is-not-found-error).

#### Create React App

If you see a lot of warnings related to source maps, see [this issue](https://github.com/facebook/create-react-app/discussions/11767) to learn more.

## Reference docs

Access the XMTP React SDK [reference documentation](https://xmtp.github.io/xmtp-web/).

## Local-first architecture

This client SDK uses a local-first architecture to help you build a production-grade and performant app. To learn more about how we use a local-first architecture, see our [official documentation](https://xmtp.org/docs/build/local-first).

## Usage

Check out our [official documentation](https://xmtp.org/docs/build/get-started/overview?sdk=react) to get started developing with XMTP and React.

## XMTP network environments

XMTP provides `production`, `dev`, and `local` network environments to support the development phases of your project. To learn more about these environments, see our [official documentation](https://xmtp.org/docs/build/authentication#environments).

> **Important**  
> When you [create a client](https://xmtp.org/docs/build/authentication?sdk=react#create-a-client), it connects to the XMTP `dev` environment by default. To learn how to use the `env` parameter to set your client's network environment, see [Configure the client](https://xmtp.org/docs/build/authentication?sdk=react#configure-the-client).

## Breaking revisions

Because this SDK is in active development, you should expect breaking revisions that might require you to adopt the latest SDK release to enable your app to continue working as expected.

XMTP communicates about breaking revisions in the [XMTP Discord community](https://discord.gg/xmtp), providing as much advance notice as possible. Additionally, breaking revisions in a release are described on the [Releases page](https://github.com/xmtp/xmtp-web/releases).

## Deprecation

Older versions of the SDK will eventually be deprecated, which means:

1. The network will not support and eventually actively reject connections from clients using deprecated versions.
2. Bugs will not be fixed in deprecated versions.

The following table provides the deprecation schedule.

| Announced                                                      | Effective | Minimum Version | Rationale |
| -------------------------------------------------------------- | --------- | --------------- | --------- |
| There are no deprecations scheduled for this SDK at this time. |           |                 |           |

Bug reports, feature requests, and PRs are welcome in accordance with these [contribution guidelines](https://github.com/xmtp/xmtp-web/blob/main/CONTRIBUTING.md).

## Developing

Run `yarn dev` to build the SDK and watch for changes, which will trigger a rebuild.

### Useful commands

- `yarn build`: Builds the SDK
- `yarn clean`: Removes `node_modules`, `lib`, and `.turbo` folders
- `yarn dev`: Builds the SDK and watches for changes, which will trigger a rebuild
- `yarn format`: Runs prettier format and write changes
- `yarn format:check`: Runs prettier format check
- `yarn lint`: Runs ESLint
- `yarn test`: Runs all unit tests
- `yarn typecheck`: Runs `tsc`
