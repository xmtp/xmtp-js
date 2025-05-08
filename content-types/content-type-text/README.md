# Text content type

This package provides an XMTP content type to support text messages.

> [!NOTE]
> This content type is included by default in official XMTP SDKs.

## Install the package

```bash
# npm
npm i @xmtp/content-type-text

# yarn
yarn add @xmtp/content-type-text

# pnpm
pnpm i @xmtp/content-type-text
```

## Send a text message

Use a string to send a text message. It's not required to specify a content type in the send options for text messages.

```tsx
await conversation.send("gm");
```

## Developing

Run `yarn dev` to build the content type and watch for changes, which will trigger a rebuild.

For more information on contributing to this repository, see our [contributing guidelines](../../CONTRIBUTING.md).
