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

### AI-Generated Contributions Policy

We do not accept pull requests that are generated entirely or primarily by AI/LLM tools (e.g., GitHub Copilot, ChatGPT, Claude). This includes:

- Automated typo fixes or formatting changes
- Generic code improvements without context
- Mass automated updates or refactoring

Pull requests that appear to be AI-generated without meaningful human oversight will be closed without review. We value human-driven, thoughtful contributions that demonstrate an understanding of the codebase and project goals.

> [!CAUTION]
> To protect project quality and maintain contributor trust, we will restrict access for users who continue to submit AI-generated pull requests.

If you use AI tools to assist your development process, please:

1. Thoroughly review and understand all generated code
2. Provide detailed PR descriptions explaining your changes and reasoning
3. Be prepared to discuss your implementation decisions and how they align with the project goals

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

### Testing

Please add unit tests when appropriate and ensure that all unit tests are passing before submitting a pull request. Note that some unit tests require a backend node to be running locally. The `test:setup` command can be run a single time to start the node in the background using Docker.

## 🚢 Publishing

This repository uses [changesets](https://github.com/changesets/changesets) to publish updates. Pull requests must contain a changeset in order for changes to be published. The [changeset-bot](https://github.com/apps/changeset-bot) will guide you through this process.
