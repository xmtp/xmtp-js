# XMTP-JS

![Test](https://github.com/xmtp/xmtp-js/actions/workflows/test.yml/badge.svg)
![Lint](https://github.com/xmtp/xmtp-js/actions/workflows/lint.yml/badge.svg)
![Build](https://github.com/xmtp/xmtp-js/actions/workflows/build.yml/badge.svg)
![Status](https://img.shields.io/badge/Project_Status-Production-brightgreen)

![x-red-sm](https://user-images.githubusercontent.com/510695/163488403-1fb37e86-c673-4b48-954e-8460ae4d4b05.png)

**XMTP client SDK for JavaScript applications**

`xmtp-js` provides a TypeScript implementation of an XMTP client for use with JavaScript and React applications.

Build with `xmtp-js` to provide messaging between blockchain wallet addresses, delivering on use cases such as wallet-to-wallet messaging and dapp-to-wallet notifications.

`xmtp-js` was included in a [security assessment](https://xmtp.org/assets/files/REP-final-20230207T000355Z-3825cbc68c115f4ec81f3b1d53a24fce.pdf) prepared by [Certik](https://www.certik.com/company/about).

To learn more about XMTP and get answers to frequently asked questions, see the [XMTP documentation](https://xmtp.org/docs).

## Playground and example apps built with `xmtp-js`

- Use the [XMTP React playground app](https://github.com/xmtp/xmtp-react-playground) as a tool to start building an app with XMTP. This basic messaging app has an intentionally unopinionated UI to help make it easier for you to build with.

- Use the [XMTP Inbox Web example app](https://github.com/xmtp-labs/xmtp-inbox-web) as a reference implementation to understand how to implement features following developer and user experience best practices.

## Reference docs

Access the `xmtp-js` client SDK [reference documentation](https://xmtp-js.pages.dev/modules).

## Install

**NPM**

```bash
npm install @xmtp/xmtp-js
```

**PNPM**

```bash
pnpm install @xmtp/xmtp-js
```

**Yarn**

```bash
yarn add @xmtp/xmtp-js
```

## Requirements

### Buffer polyfill

A Buffer polyfill is required for browser environments.

See [this solution](https://docs.xmtp.org/dms/troubleshoot#why-is-my-app-failing-with-a-buffer-is-not-found-error) for implementation details.

## Troubleshoot

### WebAssembly issues

This SDK uses WebAssembly, which may require additional configuration in your environment.

#### Vite

**vite.config.js**

```js
import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: ["@xmtp/user-preferences-bindings-wasm"],
  },
});
```

#### Next.js

Configuration is dependent on your version of Next.js.

**next.config.mjs**

Next.js < 15

```js
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@xmtp/user-preferences-bindings-wasm"],
  },
};

export default nextConfig;
```

Next.js >= 15

```js
const nextConfig = {
  serverExternalPackages: ["@xmtp/user-preferences-bindings-wasm"],
};

export default nextConfig;
```

### BigInt polyfill

This SDK uses `BigInt` in a way that's incompatible with polyfills. To ensure that a polyfill isn't added to your application bundle, update your [browserslist](https://github.com/browserslist/browserslist) configuration to exclude browsers that don't support `BigInt`.

For the list of browsers that don't support `BigInt`, see this [compatibility list](https://caniuse.com/bigint).

## Usage

Check out our [official documentation](https://xmtp.org/docs/build/get-started/overview?sdk=js) to get started developing with XMTP and JavaScript.

### Use local storage

> **Important**  
> If you are building a production-grade app, be sure to use an architecture that includes a local cache backed by an XMTP SDK.

To learn more, see [Use local-first architecture](https://xmtp.org/docs/build/local-first).

### Interacting with Snaps

If the user has a compatible version of MetaMask installed in their browser, and the `useSnaps` `ClientCreateOption` is set to `true`, the SDK will attempt to install and connect to the ["Sign in with XMTP" Snap](https://github.com/xmtp/snap) as part of client creation. If successful, all cryptographic operations will happen inside the secure context of the Snap instead of the main browser thread. This offers greater security and a smoother sign-in experience.

In cases where the Snap is being used, `Client.getKeys()` will fail because the client application has no access to the private key material when used with Snaps.

Currently, `useSnaps` uses a default value of `false`. However, in future versions of `xmtp-js`, it will be updated to use a default value of `true`.

## Breaking revisions

Because `xmtp-js` is in active development, you should expect breaking revisions that might require you to adopt the latest SDK release to enable your app to continue working as expected.

XMTP communicates about breaking revisions in the [XMTP Discord community](https://discord.gg/xmtp), providing as much advance notice as possible. Additionally, breaking revisions in an `xmtp-js` release are described on the [Releases page](https://github.com/xmtp/xmtp-js/releases).

### Deprecation

Older versions of the SDK will eventually be deprecated, which means:

1. The network will not support and eventually actively reject connections from clients using deprecated versions.
2. Bugs will not be fixed in deprecated versions.

The following table provides the deprecation schedule.

| Announced  | Effective  | Minimum Version | Rationale                                                                                                         |
| ---------- | ---------- | --------------- | ----------------------------------------------------------------------------------------------------------------- |
| 2022-08-18 | 2022-11-08 | v6.0.0          | XMTP network will stop supporting the Waku/libp2p-based client interface in favor of the new gRPC-based interface |

Issues and PRs are welcome in accordance with our [contribution guidelines](https://github.com/xmtp/xmtp-js/blob/main/CONTRIBUTING.md).

## XMTP `production` and `dev` network environments

XMTP provides both `production` and `dev` network environments to support the development phases of your project.

The `production` and `dev` networks are completely separate and not interchangeable.
For example, for a given blockchain account address, its XMTP identity on `dev` network is completely distinct from its XMTP identity on the `production` network, as are the messages associated with these identities. In addition, XMTP identities and messages created on the `dev` network can't be accessed from or moved to the `production` network, and vice versa.

> **Important**  
> When you [create a client](https://github.com/xmtp/xmtp-js/blob/main/README.md#create-a-client), it connects to the XMTP `dev` environment by default. To learn how to use the `env` parameter to set your client's network environment, see [Configure the client](https://github.com/xmtp/xmtp-js/blob/main/README.md#configure-the-client).

The `env` parameter accepts one of three valid values: `dev`, `production`, or `local`. Here are some best practices for when to use each environment:

- `dev`: Use to have a client communicate with the `dev` network. As a best practice, set `env` to `dev` while developing and testing your app. Follow this best practice to isolate test messages to `dev` inboxes.

- `production`: Use to have a client communicate with the `production` network. As a best practice, set `env` to `production` when your app is serving real users. Follow this best practice to isolate messages between real-world users to `production` inboxes.

- `local`: Use to have a client communicate with an XMTP node you are running locally. For example, an XMTP node developer can set `env` to `local` to generate client traffic to test a node running locally.

The `production` network is configured to store messages indefinitely. XMTP may occasionally delete messages and keys from the `dev` network, and will provide advance notice in the [XMTP Discord community](https://discord.gg/xmtp).
