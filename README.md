# XMTP CLIENT SDK

The XMTP SDK bundles the core code libraries, components, tools, documentation, and guides that developers require in order to build client experiences on top of the XMTP protocol and network.

## Installation

## Usage

## Developing

Before committing your time to code, please read the [CONTRIBUTING.md document](./CONTRIBUTING.md).

### Dependencies

_Node_
Please make sure you have a Node version compatible with that specified in the `/.nvmrc` file.

_PNPM_
[pnpm](https://pnpm.io) is a package manager that stores node_modules in a global cache and uses hardlinks and symlinks to link them to package dependencies. This saves on disk space, lends itself to faster installs relative to npm and yarn, and avoids thorny issues with transitive dependencies that flat node_modules (npm, yarn) introduce.
Follow the [official docs](https://pnpm.io/installation) for the install instructions appropriate for your system/setup.
@TODO: [Node's --preserve-symlinks flag does not work when executed in a project that uses pnpm.]
@TODO: [pnpx has been changed to pnpm dlx, eg `pnpm dlx create-react-app ./my-app`]

## Versioning & Releases
To generate a new changeset, run `pnpm changeset` in the repository root.

To release changes, run `pnpm changeset version` (bumps the versions of the packages specified with `pnpm changeset` and any of their local dependencies, and updates the changelog files).
Next, run `pnpm install` to update the lockfile and rebuild packages, and commit the changes. 
To publish all packages that have bumped versions, run `pnpm publish -r`. 

## License
@TODO
