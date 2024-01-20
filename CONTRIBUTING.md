# Contributing

Thank you for considering contributing to this repo! Community contributions like yours are key to the development and adoption of XMTP. Your questions, feedback, suggestions, and code contributions are welcome!

## ❔ Questions

Have a question about how to build with XMTP? Ask your question and learn with the community in the [XMTP Community Forums](https://community.xmtp.org/).

## 🐞 Bugs

Report a bug using [GitHub Issues](https://github.com/xmtp/xmtp-js-content-types/issues).

## ✨ Feature requests

Request a feature using [GitHub Issues](https://github.com/xmtp/xmtp-js-content-types/issues).

## 🔀 Pull requests

PRs are encouraged, but consider starting with a feature request to temperature-check first. If the PR involves a major change to the protocol, the work should be fleshed out as an [XMTP Improvement Proposal](https://github.com/xmtp/XIPs/blob/main/XIPs/xip-0-purpose-process.md) before work begins.

After a pull request is submitted, a single approval is required to merge it.

## 🔧 Developing

### Prerequisites

#### Node

Please make sure you have a compatible version as specified in `package.json`. We recommend using a Node version manager such as [nvm](https://github.com/nvm-sh/nvm) or [nodenv](https://github.com/nodenv/nodenv).

#### Yarn

This repository uses the [Yarn package manager](https://yarnpkg.com/). To use it, enable [Corepack](https://yarnpkg.com/corepack), if it isn't already, by running `corepack enable`.

## Running tests

Before running unit tests, a required Docker container must be started. To do so, start Docker and run `yarn test:setup`. Run `yarn test:teardown` to stop the Docker container.

## Useful commands

- `yarn`: Installs all dependencies
- `yarn build`: Build all packages
- `yarn clean`: Remove all `node_modules`, `.turbo`, and build folders, clear Yarn cache
- `yarn format`: Run prettier format and write changes on all packages
- `yarn format:check`: Run prettier format check on all packages
- `yarn lint`: Lint all packages
- `yarn test`: Test all packages
- `yarn test:setup`: Start a local development node using Docker (only needs to be run once)
- `yarn typecheck`: Typecheck all packages

### Testing

Please add unit tests when appropriate and ensure that all unit tests are passing before submitting a pull request. Note that some unit tests require a backend node to be running locally. The `test:setup` command can be run a single time to start the node in the background using Docker.

## 🚢 Publishing

This repository uses [changesets](https://github.com/changesets/changesets) to publish updates. Pull requests must contain a changeset in order for changes to be published. The [changeset-bot](https://github.com/apps/changeset-bot) will guide you through this process.
