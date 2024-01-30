import type { Client } from "@xmtp/xmtp-js";
import { OG_PROXY_URL } from "./constants";
import type { FramesResponse } from "./types";

export class FramesClient {
  xmtpClient: Client;

  constructor(xmtpClient: Client) {
    this.xmtpClient = xmtpClient;
  }

  static async readMetadata(url: string): Promise<FramesResponse> {
    const response = await fetch(
      `${OG_PROXY_URL}?url=${encodeURIComponent(url)}`,
    );
    return (await response.json()) as FramesResponse;
  }
}
