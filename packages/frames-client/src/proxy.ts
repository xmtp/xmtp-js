import { OPEN_FRAMES_PROXY_URL } from "./constants";
import { ApiError } from "./errors";
import type {
  FramePostPayload,
  FramesApiRedirectResponse,
  FramesApiResponse,
} from "./types";

export default class OpenFramesProxy {
  baseUrl: string;

  constructor(baseUrl: string = OPEN_FRAMES_PROXY_URL) {
    this.baseUrl = baseUrl;
  }

  async readMetadata(url: string): Promise<FramesApiResponse> {
    const response = await fetch(
      `${this.baseUrl}?url=${encodeURIComponent(url)}`,
    );

    if (!response.ok) {
      throw new ApiError(`Failed to read metadata for ${url}`, response.status);
    }

    return (await response.json()) as FramesApiResponse;
  }

  async post(
    url: string,
    payload: FramePostPayload,
  ): Promise<FramesApiResponse> {
    const response = await fetch(
      `${this.baseUrl}?url=${encodeURIComponent(url)}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to post to frame: ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as FramesApiResponse;
  }

  async postRedirect(
    url: string,
    payload: FramePostPayload,
  ): Promise<FramesApiRedirectResponse> {
    const response = await fetch(
      `${this.baseUrl}redirect?url=${encodeURIComponent(url)}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to post to frame: ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as FramesApiRedirectResponse;
  }

  mediaUrl(url: string): string {
    return `${this.baseUrl}media?url=${encodeURIComponent(url)}`;
  }
}
