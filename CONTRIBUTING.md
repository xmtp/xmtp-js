# Contributing

Thank you for considering contributing to this repo! Community contributions like yours are key to the development and adoption of XMTP. Your questions, feedback, suggestions, and code contributions are welcome!

## ❔ Questions

Have a question about how to build with XMTP? Ask your question and learn with the community in the [XMTP Community Forums](https://community.xmtp.org/).

## 🐞 Bugs

Report a bug using [GitHub Issues](https://github.com/xmtp/xmtp-js/issues).

## ✨ Feature Requests

Request a feature using [GitHub Issues](https://github.com/xmtp/xmtp-js/issues).

## 🔀 Pull Requests

PRs are encouraged, but consider starting with a feature request to temperature-check first. If the PR involves a major change to the protocol, the work should be fleshed out as an [XMTP Improvement Proposal](https://community.xmtp.org/t/xip-0-xip-purpose-process-guidelines/475) before work begins.

After a pull request is submitted, a single approval is required to merge it.

## 🔧 Developing

### Prerequisites

#### Node

Please make sure you have a compatible version as specified in `package.json`. We recommend using a Node version manager such as [nvm](https://github.com/nvm-sh/nvm) or [nodenv](https://github.com/nodenv/nodenv).

#### Yarn

This repository uses the [Yarn package manager](https://yarnpkg.com/). To use it, enable [Corepack](https://yarnpkg.com/corepack), if it isn't already, by running `corepack enable`.

### Useful commands

- `yarn`: Installs all dependencies
- `yarn build`: Builds all packages in the `/packages` folder
- `yarn clean`: Remove all `node_modules`, `.turbo`, and build folders, clear Yarn cache
- `yarn format`: Run prettier format and write changes
- `yarn format:check`: Run prettier format check
- `yarn test`: Run the unit test suite
- `yarn test:setup`: Start a local development node using Docker (only needs to be run once)
- `yarn lint`: Lint with ESLint
- `yarn typecheck`: Typecheck with `tsc`

### Testing and validation

Please add unit tests when appropriate and ensure that all unit tests are passing before submitting a pull request. Note that some unit tests require a backend node to be running locally. The `test:setup` command can be run a single time to start the node in the background using Docker.

Manual validation requires setting up a client app such as the [example app](https://github.com/xmtp/example-chat-react). Once you have cloned and run the example app, it will use a published npm version of `xmtp-js` by default. You can point it to your local `xmtp-js` repository by using `yarn link` or `npm link` from the `example-chat-react` directory, which will update its `package.json`. Once the example app is running, any further changes you make to `xmtp-js` will be reflected in the app after you run `yarn build` in the `xmtp-js` directory and then reload the app.

## 🚢 Publishing

This repository uses [changesets](https://github.com/changesets/changesets) to publish updates. Pull requests must contain a changeset in order for changes to be published. The [changeset-bot](https://github.com/apps/changeset-bot) will guide you through this process.

### Beta releases

To begin development on a beta release, make sure the `beta` branch is up to date with the `main` branch. Create a new branch from the `beta` branch. After merging your changes into the `beta` branch, you must create a PR from the `beta` branch into the `releases/beta` branch. Once merged, a beta release will be published to the NPM registry.

After the beta period has ended, merge the latest `beta` branch into `main` to publish a production release with the changes.
