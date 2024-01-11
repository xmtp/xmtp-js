# Read receipt content type

![Status](https://img.shields.io/badge/Content_type_status-Standards--track-yellow) ![Status](https://img.shields.io/badge/Reference_implementation_status-Beta-yellow)

This package provides an XMTP content type to support on-chain transaction references.

> **Open for feedback**  
> You are welcome to provide feedback on this implementation by commenting on the [Proposal for on-chain transaction reference content type](https://github.com/orgs/xmtp/discussions/37).

## What’s a transaction reference?

TODO

## Why transaction references?

TODO

## Install the package

```bash
# npm
npm i @xmtp/content-type-transaction-reference

# yarn
yarn add @xmtp/content-type-transaction-reference

# pnpm
pnpm i @xmtp/content-type-transaction-reference
```

## Create a transaction reference

TODO

## Send a transaction reference

TODO

## Receive a transaction reference

TODO

## Display the transaction reference

TODO

## Developing

Run `yarn dev` to build the content type and watch for changes, which will trigger a rebuild.

## Testing

Before running unit tests, start the required Docker container at the root of this repository. For more info, see [Running tests](../../README.md#running-tests).

## Useful commands

- `yarn build`: Builds the content type
- `yarn clean`: Removes `node_modules`, `dist`, and `.turbo` folders
- `yarn dev`: Builds the content type and watches for changes, which will trigger a rebuild
- `yarn format`: Runs Prettier format and write changes
- `yarn format:check`: Runs Prettier format check
- `yarn lint`: Runs ESLint
- `yarn test:setup`: Starts a necessary Docker container for testing
- `yarn test:teardown`: Stops Docker container for testing
- `yarn test`: Runs all unit tests
- `yarn typecheck`: Runs `tsc`
