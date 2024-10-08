# Text content type

This package provides an XMTP content type to support text messages.

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

## Testing

Before running unit tests, start the required Docker container at the root of this repository. For more info, see [Running tests](../../README.md#running-tests).

## Useful commands

- `yarn build`: Builds the content type
- `yarn clean`: Removes `node_modules`, `dist`, and `.turbo` folders
- `yarn dev`: Builds the content type and watches for changes, which will trigger a rebuild
- `yarn format`: Runs prettier format and write changes
- `yarn format:check`: Runs prettier format check
- `yarn lint`: Runs ESLint
- `yarn test:setup`: Starts a necessary docker container for testing
- `yarn test:teardown`: Stops docker container for testing
- `yarn test`: Runs all unit tests
- `yarn typecheck`: Runs `tsc`
