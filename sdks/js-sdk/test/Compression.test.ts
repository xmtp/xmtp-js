import { ContentTypeText } from "@xmtp/content-type-text";
import { content as proto } from "@xmtp/proto";
import {
  compress,
  decompress,
  readStreamFromBytes,
  writeStreamToBytes,
} from "@/Compression";

describe("Compression", function () {
  it("can stream bytes from source to sink", async function () {
    const from = new Uint8Array(111).fill(42);
    // make sink smaller so that it has to grow a lot
    const to = { bytes: new Uint8Array(3) };
    await readStreamFromBytes(from, 23).pipeTo(writeStreamToBytes(to, 1000));
    expect(from).toEqual(to.bytes);
  });

  it("will not write beyond limit", () => {
    const from = new Uint8Array(111).fill(42);
    const to = { bytes: new Uint8Array(10) };
    expect(
      readStreamFromBytes(from, 23).pipeTo(writeStreamToBytes(to, 100)),
    ).rejects.toThrow("maximum output size exceeded");
  });

  it("compresses and decompresses", async function () {
    const uncompressed = new Uint8Array(55).fill(42);
    const compressed = new Uint8Array([
      120, 156, 211, 210, 34, 11, 0, 0, 252, 223, 9, 7,
    ]);
    const content = {
      type: ContentTypeText,
      parameters: {},
      content: uncompressed,
      compression: proto.Compression.COMPRESSION_DEFLATE,
    };
    await compress(content);
    expect(content.content).toEqual(compressed);
    await decompress(content, 1000);
    expect(content.content).toEqual(uncompressed);
  });
});
