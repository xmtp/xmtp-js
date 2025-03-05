# XMTP client SDK for browsers

This package provides the XMTP client SDK for browsers.

To keep up with the latest SDK developments, see the [Issues tab](https://github.com/xmtp/xmtp-js/issues) in this repo.

To learn more about XMTP and get answers to frequently asked questions, see the [XMTP documentation](https://xmtp.org/docs).

> [!CAUTION]
> This SDK is in beta status and ready for you to build with in production. Software in this status may change based on feedback.

## Limitations

This SDK uses the [origin private file system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) (OPFS) to persist a SQLite database and the [SyncAccessHandle Pool VFS](https://sqlite.org/wasm/doc/trunk/persistence.md#vfs-opfs-sahpool) to access it. This VFS does not support multiple simultaneous connections.

This means that when using this SDK in your application, you must prevent multiple browser tabs or windows from accessing your application at the same time.

### Bundlers

This SDK and some of its dependencies use `import.meta.url`. Some bundlers must be configured to account for this during development.

#### Vite

Add the following to `vite.config.ts`:

```typescript
import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: ["@xmtp/wasm-bindings"],
  },
});
```

## Install

**NPM**

```bash
npm install @xmtp/browser-sdk
```

**PNPM**

```bash
pnpm install @xmtp/browser-sdk
```

**Yarn**

```bash
yarn add @xmtp/browser-sdk
```

## Reference docs

Access the XMTP client browser SDK [reference documentation](TBD).

## Usage

Check out our [official documentation](https://xmtp.org/docs/build/get-started/overview) to get started developing with XMTP.

## XMTP network environments

XMTP provides `production`, `dev`, and `local` network environments to support the development phases of your project. To learn more about these environments, see our [official documentation](https://xmtp.org/docs/build/authentication#environments).

> **Important**  
> When you [create a client](https://xmtp.org/docs/build/authentication#create-a-client), it connects to the XMTP `dev` environment by default. To learn how to use the `env` parameter to set your client's network environment, see [Configure the client](https://xmtp.org/docs/build/authentication#configure-the-client).

## Breaking revisions

Because this SDK is in active development, you should expect breaking revisions that might require you to adopt the latest SDK release to enable your app to continue working as expected.

XMTP communicates about breaking revisions in the [XMTP Discord community](https://discord.gg/xmtp), providing as much advance notice as possible. Additionally, breaking revisions in a release are described on the [Releases page](https://github.com/xmtp/xmtp-js/releases).

## Deprecation

Older versions of the SDK will eventually be deprecated, which means:

1. The network will not support and eventually actively reject connections from clients using deprecated versions.
2. Bugs will not be fixed in deprecated versions.

The following table provides the deprecation schedule.

| Announced                                                      | Effective | Minimum Version | Rationale |
| -------------------------------------------------------------- | --------- | --------------- | --------- |
| There are no deprecations scheduled for this SDK at this time. |           |                 |           |

Bug reports, feature requests, and PRs are welcome in accordance with these [contribution guidelines](https://github.com/xmtp/xmtp-js/blob/main/CONTRIBUTING.md).

## Developing

Run `yarn dev` to build the SDK and watch for changes, which will trigger a rebuild.

### Useful commands

- `yarn build`: Builds the SDK
- `yarn clean`: Removes `node_modules`, `dist`, and `.turbo` folders
- `yarn dev`: Builds the SDK and watches for changes, which will trigger a rebuild
- `yarn test`: Runs all tests
- `yarn typecheck`: Runs `tsc`
