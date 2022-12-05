# Contributing

If you're seeing this document, you are an early contributor to the development and success of XMTP. We welcome your questions, feedback, suggestions, and code contributions.

## ❔ Questions

Have a question? We welcome you to ask it in [Q&A discussions](https://github.com/orgs/xmtp/discussions/categories/q-a).

## 🐞 Bugs

Bugs should be reported as GitHub Issues. Please confirm there isn't already an open issue and include detailed steps to reproduce.

## ✨ Feature Requests

These should also be submitted as GitHub Issues. Again, please confirm there isn't already an open issue. Let us know what use cases this feature would unlock so that we can investigate and prioritize.

## 🔀 Pull Requests

PRs are encouraged, but we suggest starting with a Feature Request to temperature-check first. If the PR would involve a major change to the protocol, it should be fleshed out as an [XMTP Improvement Proposal](https://github.com/xmtp/XIPs/blob/main/XIPs/xip-0-purpose-process.md) before work begins.

## 🔧 Developing

### Auto-releasing and commit conventions

A new version of this package will be automatically published whenever there is a merge to the `main` branch. Specifically, new GitHub releases and tags will be created, and a new NPM package version will be published. The release version increment type is derived from the commits that were bundled in the merge to `main`, using [semantic-release commit message conventions](https://github.com/semantic-release/semantic-release#commit-message-format).

The table below shows example commits and the resulting release type:

<!-- prettier-ignore-start -->
| Commit message                                                                                                                                                                                   | Release type                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `fix(pencil): stop graphite breaking when too much pressure applied`                                                                                                                             | ~~Patch~~ Fix Release                                                                                           |
| `feat(pencil): add 'graphiteWidth' option`                                                                                                                                                       | ~~Minor~~ Feature Release                                                                                       |
| `perf(pencil): remove graphiteWidth option`<br><br>`BREAKING CHANGE: The graphiteWidth option has been removed.`<br>`The default graphite width of 10mm is always used for performance reasons.` | ~~Major~~ Breaking Release <br /> (Note that the `BREAKING CHANGE:` token must be in the footer of the commit) |
<!-- prettier-ignore-end -->

This is currently configured to use the [Angular Commit Message Conventions](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format). e.g. `feat: add message signing` would cause a minor release.

### Prerequisites

#### Node

Please make sure you have a Node version compatible with that specified in the root `.nvmrc` file. We recommend using `nvm` to manage local node versions - find install instructions appropriate for your system [here](https://github.com/nvm-sh/nvm#installing-and-updating).

#### Buf

You will need to install [Buf](https://buf.build/) in your environment in order to `npm build` this package from source.

```bash
brew install bufbuild/buf/buf
```
