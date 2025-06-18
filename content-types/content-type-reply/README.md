# Reply content type

This package provides an XMTP content type to support direct replies to messages.

> **Open for feedback**  
> You are welcome to provide feedback on this implementation by commenting on [XIP-20: Reactions content type](https://community.xmtp.org/t/xip-20-reactions-content-type/524).

## What’s a reply?

A reply action is a way to respond directly to a specific message in a conversation. Instead of sending a new message, users can select and reply to a particular message.

## Why replies?

Providing replies in your app enables users to maintain context and clarity in their conversations. Replies can also help organize messages, making messages easier to find and reference in the future. This user experience can help make your app a great tool for collaboration.

## Install the package

```bash
# npm
npm i @xmtp/content-type-reply

# yarn
yarn add @xmtp/content-type-reply

# pnpm
pnpm i @xmtp/content-type-reply
```

## Create a reply

With XMTP, replies are represented as objects with the following keys:

- `reference`: The message ID for the message that is being reacted to
- `content`: A string representation of the reply

```tsx
const reply: Reply = {
  reference: someMessageID,
  content: "I concur",
};
```

## Send a reply

Now that you have a reply, you can send it:

```tsx
await conversation.messages.send(reply, {
  contentType: ContentTypeReply,
});
```

> **Note**  
> `contentFallback` text is provided by the codec and gives clients that _don't_ support a content type the option to display some useful context. For cases where clients *do* support the content type, they can use the content fallback as alt text for accessibility purposes.

## Receive a reply

Now that you can send a reply, you need a way to receive a reply. For example:

```tsx
// Assume `loadLastMessage` is a thing you have
const message: DecodedMessage = await loadLastMessage();

if (!message.contentType.sameAs(ContentTypeReply)) {
  // We do not have a reply. A topic for another blog post.
  return;
}

// We've got a reply.
const reply: Reply = message.content;
```

## Display the reply

Generally, replies should be displayed alongside the original message to provide context. Ultimately, how you choose to display replies is completely up to you.

## Developing

Run `yarn dev` to build the content type and watch for changes, which will trigger a rebuild.

For more information on contributing to this repository, see our [contributing guidelines](../../CONTRIBUTING.md).
