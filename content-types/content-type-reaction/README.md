# Reaction content type

This package provides an XMTP content type to support reactions to messages.

> **Open for feedback**  
> You are welcome to provide feedback on this implementation by commenting on [XIP-20: Reactions content type](https://community.xmtp.org/t/xip-20-reactions-content-type/524).

## What’s a reaction?

A reaction is a quick and often emoji-based way to respond to a message. Reactions are usually limited to a predefined set of emojis or symbols provided by the messaging app.

## Why reactions?

Providing message reactions in your app enables users to easily express a general sentiment or emotion toward a message. It also provides a handy way to acknowledge a message or show a particular emotional reaction without engaging in a detailed response.

## Install the package

```bash
# npm
npm i @xmtp/content-type-reaction

# yarn
yarn add @xmtp/content-type-reaction

# pnpm
pnpm i @xmtp/content-type-reaction
```

## Create a reaction

With XMTP, reactions are represented as objects with the following keys:

- `reference`: The message ID for the message that is being reacted to
- `action`: The action of the reaction (`added` or `removed`)
- `content`: A string representation of a reaction (e.g. `smile`) to be interpreted by clients

```tsx
const reaction: Reaction = {
  reference: someMessageID,
  action: "added",
  content: "smile",
};
```

## Send a reaction

Now that you have a reaction, you can send it:

```tsx
await conversation.messages.send(reaction, {
  contentType: ContentTypeReaction,
});
```

> **Note**  
> `contentFallback` text is provided by the codec and gives clients that _don't_ support a content type the option to display some useful context. For cases where clients *do* support the content type, they can use the content fallback as alt text for accessibility purposes.

## Receive a reaction

Now that you can send a reaction, you need a way to receive a reaction. For example:

```tsx
// Assume `loadLastMessage` is a thing you have
const message: DecodedMessage = await loadLastMessage();

if (!message.contentType.sameAs(ContentTypeReaction)) {
  // We do not have a reaction. A topic for another blog post.
  return;
}

// We've got a reaction.
const reaction: Reaction = message.content;
```

## Display the reaction

Generally, reactions should be interpreted as emoji. So, `smile` would translate to :smile: in UI clients. That being said, how you ultimately choose to render a reaction in your app is up to you.

## Developing

Run `yarn dev` to build the content type and watch for changes, which will trigger a rebuild.

For more information on contributing to this repository, see our [contributing guidelines](../../CONTRIBUTING.md).
