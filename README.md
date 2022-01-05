# XMTP CLIENT SDK

The XMTP SDK bundles the core code libraries, components, tools, documentation, and guides that developers require in order to build client experiences on top of the XMTP protocol and network.

## Developing

Before committing your time to code, please read the [CONTRIBUTING.md document]Before committing your time to code, please read the [CONTRIBUTING.md document](https://github.com/xmtp-org/xmtp-js-sdk/blob/main/CONTRIBUTING.md).

### Prerequisites

**Node**
Please make sure you have a Node version compatible with that specified in the root `.nvmrc` file. We recommend using `nvm` to manage local node versions - find install instructions appropriate for your system [here](https://github.com/nvm-sh/nvm#installing-and-updating).

**PNPM**
[pnpm](https://pnpm.io) is a package manager that stores node modules in an global cache (optimized tree structure) and uses hardlinks and symlinks to link them to package dependencies. This leads to faster installs relative to npm and yarn, and mitigates issues with transitive dependencies that these other package managers introduce by using flattened module caches.

Follow the [official docs](https://pnpm.io/installation) for the install instructions appropriate for your system/setup.

[@TODO(fw): Node's --preserve-symlinks flag does not work when executed in a project that uses pnpm.]
[@TODO(fw): pnpx has been changed to pnpm dlx, eg `pnpm dlx create-react-app ./my-app`]

## Versioning & Releases

We're using the [changesets package](https://github.com/changesets/changesets) for versioning, generating changesets, and publishing.

To generate a new changeset, run `pnpm changeset` in the repository root.

To release changes, run `pnpm changeset version` (bumps the versions of the packages specified with `pnpm changeset` and any of their local dependencies, and updates the changelog files).
Next, run `pnpm install` to update the lockfile and rebuild packages, and commit the changes. 

To publish all packages that have bumped versions, run `pnpm publish -r`.

## License
@TODO
