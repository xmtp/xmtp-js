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
- `yarn bench`: Run the benchmarking suite
- `yarn build`: Builds the JS SDK
- `yarn format`: Run prettier format and write changes
- `yarn format:check`: Run prettier format check
- `yarn test`: Run the unit test suite
- `yarn test:setup`: Start a local development node using Docker (only needs to be run once)
- `yarn lint`: Lint with ESLint
- `yarn typecheck`: Typecheck with `tsc`

### Testing and validation

Please add unit tests when appropriate and ensure that all unit tests are passing before submitting a pull request. Note that some unit tests require a backend node to be running locally. The `test:setup` command can be run a single time to start the node in the background using Docker.

Manual validation requires setting up a client app such as the [example app](https://github.com/xmtp/example-chat-react). Once you have cloned and run the example app, it will use a published npm version of `xmtp-js` by default. You can point it to your local `xmtp-js` repository by using `yarn link` or `npm link` from the `example-chat-react` directory, which will update its `package.json`. Once the example app is running, any further changes you make to `xmtp-js` will be reflected in the app after you run `yarn build` in the `xmtp-js` directory and then reload the app.

### Auto-releasing and commit conventions

A new version of this package will be automatically published whenever there is a merge to the `main` branch. Specifically, new GitHub releases and tags will be created, and a new NPM package version will be published. The release version increment type is derived from the format of the commit messages that were bundled in the merge to `main`, using [semantic-release commit message conventions](https://github.com/semantic-release/semantic-release#commit-message-format).

The table below shows example commits and the resulting release type for a `pencil` project:

<!-- prettier-ignore-start -->
| Commit message                                                                                                                                                                                   | Release type                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `docs: describe scribble feature` | No Release |
| `test: fix failing unit test` | No Release |
| `fix: stop graphite breaking when too much pressure applied` | ~~Patch~~ Fix Release |
| `feat: add 'graphiteWidth' option` | ~~Minor~~ Feature Release |
| `perf: remove graphiteWidth option`<br><br>`BREAKING CHANGE: The graphiteWidth option has been removed.`<br>`The default graphite width of 10mm is always used for performance reasons.` | ~~Major~~ Breaking Release <br /> (Note that the `BREAKING CHANGE:` token must be in the footer of the commit) |
<!-- prettier-ignore-end -->

This is currently configured to use the [Angular Commit Message Conventions](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format). e.g. `feat: add message signing` would cause a minor release.

If there are multiple commits within a single pull request, each commit will be listed as a separate bullet point in the [release notes](https://github.com/xmtp/xmtp-js/releases) and bundled together in a release of the highest increment type specified.

If your commit messages are not to your liking, it is permitted to rewrite the history on your branch and force-push it before merging it. Make sure you are never force-pushing on `main`, and that the following is in your `~/.gitconfig` file.

```
[push]
	default = simple
```
