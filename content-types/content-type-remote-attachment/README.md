# Remote attachment content type

This package provides an XMTP content type to support sending file attachments that are stored off-network. Use it to enable your app to send and receive message attachments.

## What’s an attachment?

Attachments are files. More specifically, attachments are objects that have:

- `filename` Most files have names, at least the most common file types.
- `mimeType` What kind of file is it? You can often assume this from the file extension, but it's nice to have a specific field for it. [Here's a list of common mime types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types).
- `data` What is this file's data? Most files have data. If the file doesn't have data, then it's probably not the most interesting thing to send.

## Why remote attachments?

Because XMTP messages can only be up to 1MB in size, we need to store the attachment somewhere other than the XMTP network. In other words, we need to store it in a remote location.

## What about encryption?

End-to-end encryption must apply not only to XMTP messages, but to message attachments as well. For this reason, we need to encrypt the attachment before we store it.

## Install the package

```bash
# npm
npm i @xmtp/content-type-remote-attachment

# yarn
yarn add @xmtp/content-type-remote-attachment

# pnpm
pnpm i @xmtp/content-type-remote-attachment
```

## Developing

Run `yarn dev` to build the content type and watch for changes, which will trigger a rebuild.

For more information on contributing to this repository, see our [contributing guidelines](../../CONTRIBUTING.md).
