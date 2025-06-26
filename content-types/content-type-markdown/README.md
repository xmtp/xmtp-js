# Markdown content type

This package provides an XMTP content type to support markdown in messages.

## Install the package

```bash
# npm
npm i @xmtp/content-type-markdown

# yarn
yarn add @xmtp/content-type-markdown

# pnpm
pnpm i @xmtp/content-type-markdown
```

## Send a message with markdown

```tsx
const markdown = `
# Test

This is a markdown message with **bold** and *italic* text.
`;

await conversation.send(markdown, ContentTypeMarkdown);
```

## Developing

Run `yarn dev` to build the content type and watch for changes, which will trigger a rebuild.

For more information on contributing to this repository, see our [contributing guidelines](../../CONTRIBUTING.md).
