# frames-client

## Usage

```ts
const xmtpClient = await Client.create(wallet);
const framesClient = new FramesClient(xmtpClient);

const frameUrl = "https://www.myframe.xyz";

// Read data from a frame
const frameMetadata = await readMetadata(frameUrl);

// Handle a click to button 2 from a conversation with topic "/xmtp/0/123" on messageId "45678"
const payload = await signFrameAction(frameUrl, 2, "/xmtp/0/123", "45678");
const updatedFrameMetadata = await postToFrame(frameUrl, payload);
```
