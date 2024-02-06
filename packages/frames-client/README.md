# frames-client

## Usage

```ts
const xmtpClient = await Client.create(wallet);
const framesClient = new FramesClient(xmtpClient);

const frameUrl = "https://www.myframe.xyz";

// Read data from a frame
const frameMetadata = await readMetadata(frameUrl);

// Handle a click to button 2 from a conversation with topic "/xmtp/0/123" and participant addresses "abc" and "xyz"
const payload = await signFrameAction({
  frameUrl,
  buttonIndex: 2,
  conversationTopic: "/xmtp/0/123",
  participantAccountAddresses: ["abc", "xyz"],
});
const updatedFrameMetadata = await postToFrame(frameUrl, payload);
```
