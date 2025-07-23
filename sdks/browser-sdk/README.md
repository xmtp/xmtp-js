# XMTP client SDK for browsers

This package provides the XMTP client SDK for browsers.

To keep up with the latest SDK developments, see the [Issues tab](https://github.com/xmtp/xmtp-js/issues) in this repo.

> [!CAUTION]
> This SDK is in beta status and ready for you to build with in production. Software in this status may change based on feedback.

## Documentation

To learn how to use the XMTP client SDK for browsers, see [Get started with the XMTP Browser SDK](https://docs.xmtp.org/sdks/browser).

## SDK reference

Coming soon

## Limitations

This SDK uses the [origin private file system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) (OPFS) to persist a SQLite database and the [SyncAccessHandle Pool VFS](https://sqlite.org/wasm/doc/trunk/persistence.md#vfs-opfs-sahpool) to access it. This VFS does not support multiple simultaneous connections.

This means that when using this SDK in your app, you must prevent multiple browser tabs or windows from accessing your app at the same time.

### Bundlers

This SDK and some of its dependencies use `import.meta.url`. Some bundlers must be configured to account for this during development.

#### Vite

Add the following to `vite.config.ts`:

```typescript
import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: ["@xmtp/wasm-bindings", "@xmtp/browser-sdk"],
    include: ["@xmtp/proto"],
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

## Developing

Run `yarn dev` to build the SDK and watch for changes, which will trigger a rebuild.

### Useful commands

- `yarn build`: Builds the SDK
- `yarn clean`: Removes `node_modules`, `dist`, and `.turbo` folders
- `yarn dev`: Builds the SDK and watches for changes, which will trigger a rebuild
- `yarn test`: Runs all tests
- `yarn typecheck`: Runs `tsc`

## Breaking revisions

Because this SDK is in active development, you should expect breaking revisions that might require you to adopt the latest SDK release to enable your app to continue working as expected.

Breaking revisions in a Browser SDK release are described on the [Releases page](https://github.com/xmtp/xmtp-js/releases).

## Deprecation

Older versions of the SDK will eventually be deprecated, which means:

1. The network will not support and eventually actively reject connections from clients using deprecated versions.
2. Bugs will not be fixed in deprecated versions.

The following table provides the deprecation schedule.

| Announced                   | Effective   | Minimum Version | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------- | ----------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No more support for XMTP V2 | May 1, 2025 | >=1.1.4         | In a move toward better security with MLS and the ability to decentralize, we will be shutting down XMTP V2 and moving entirely to XMTP V3. To learn more about V2 deprecation, see [XIP-53: XMTP V2 deprecation plan](https://community.xmtp.org/t/xip-53-xmtp-v2-deprecation-plan/867). To learn how to upgrade, see [@xmtp/browser-sdk v1.1.4](https://github.com/xmtp/xmtp-js/releases/tag/%40xmtp%2Fbrowser-sdk%401.1.4). |

Bug reports, feature requests, and PRs are welcome in accordance with these [contribution guidelines](https://github.com/xmtp/xmtp-js/blob/main/CONTRIBUTING.md).
