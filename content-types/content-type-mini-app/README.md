# Mini app content type

This package provides an XMTP content type to support mini apps.

## Install the package

```bash
# npm
npm i @xmtp/content-type-mini-app

# yarn
yarn add @xmtp/content-type-mini-app

# pnpm
pnpm i @xmtp/content-type-mini-app
```

## Send a mini-app message

```tsx
await conversation.send(
  {
    type: "action",
    details: {
      author: "XMTP",
      version: "1.0.0",
      name: "My XMTP App",
    },
    metadata: {
      id: "hello-world",
    },
    action: {
      type: "ui",
      data: {
        respond: "hello",
      },
      root: {
        type: "stack-layout",
        props: {
          children: [
            {
              type: "text",
              text: "Hello, world!",
            },
            {
              type: "button",
              label: "Say hello",
              action: {
                type: "send-data",
                data: ["$respond"],
              },
            },
          ],
        },
      },
    },
  },
  ContentTypeMiniApp,
);
```

## Developing

Run `yarn dev` to build the content type and watch for changes, which will trigger a rebuild.

## Testing

Before running unit tests, start the required Docker container at the root of this repository. For more info, see [Running tests](../../README.md#running-tests).

## Useful commands

- `yarn build`: Builds the content type
- `yarn clean`: Removes `node_modules`, `dist`, and `.turbo` folders
- `yarn dev`: Builds the content type and watches for changes, which will trigger a rebuild
- `yarn lint`: Runs ESLint
- `yarn test:setup`: Starts a necessary docker container for testing
- `yarn test:teardown`: Stops docker container for testing
- `yarn test`: Runs all unit tests
- `yarn typecheck`: Runs `tsc`
