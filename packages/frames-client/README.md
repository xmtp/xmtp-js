# frames-client

## Usage

```ts
const xmtpClient = await Client.create(wallet);
const framesClient = new FramesClient(xmtpClient);

const frameUrl = "https://www.myframe.xyz";

// Read data from a frame
const frameMetadata = await framesClient.proxy.readMetadata(frameUrl);

// Get a proxied image URL, which you can use directly in an <image> tag
const imageUrl = framesClient.proxy.mediaUrl(
  frameMetadata.metaTags["fc:frame:image"],
);

// Handle a click to button 2 from a conversation with topic "/xmtp/0/123" and participant addresses "abc" and "xyz"
const payload = await signFrameAction({
  frameUrl,
  buttonIndex: 2,
  conversationTopic: "/xmtp/0/123",
  participantAccountAddresses: ["abc", "xyz"],
});

// If the button action type was `post`
const updatedFrameMetadata = await framesClient.proxy.post(frameUrl, payload);
// If the button action type was `post_redirect`
const { redirectedTo } = await framesClient.proxy.postRedirect(
  frameUrl,
  payload,
);
```
