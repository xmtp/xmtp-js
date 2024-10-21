# Group updated content type

This package provides an XMTP content type to support group updated messages.

## Install the package

```bash
# npm
npm i @xmtp/content-type-group-updated

# yarn
yarn add @xmtp/content-type-group-updated

# pnpm
pnpm i @xmtp/content-type-group-updated
```

## Notes

This content type is included by default in official XMTP SDKs.

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
