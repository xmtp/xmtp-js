import { OpenFramesProxy as BaseProxy } from "@open-frames/proxy-client";
import { OPEN_FRAMES_PROXY_URL } from "./constants";
import type {
  FramePostPayload,
  FramesApiRedirectResponse,
  FramesApiResponse,
  FramesTransactionApiResponse,
} from "./types";

export default class OpenFramesProxy {
  inner: BaseProxy;

  constructor(baseUrl: string = OPEN_FRAMES_PROXY_URL) {
    this.inner = new BaseProxy(baseUrl);
  }

  readMetadata(url: string) {
    return this.inner.readMetadata(url);
  }

  post(url: string, payload: FramePostPayload): Promise<FramesApiResponse> {
    return this.inner.post(url, payload);
  }

  postRedirect(
    url: string,
    payload: FramePostPayload,
  ): Promise<FramesApiRedirectResponse> {
    return this.inner.postRedirect(url, payload);
  }

  postTransaction(
    url: string,
    payload: FramePostPayload,
  ): Promise<FramesTransactionApiResponse> {
    return this.inner.postTransaction(url, payload);
  }

  mediaUrl(url: string): string {
    if (url?.startsWith("data:")) {
      return url;
    }
    return this.inner.mediaUrl(url);
  }
}
