import { messageApi } from "@xmtp/proto";
import type {
  InitReq,
  NotifyStreamEntityArrival,
} from "@xmtp/proto/ts/dist/types/fetch.pb";
import { vi } from "vitest";
import ApiClient, {
  GrpcError,
  GrpcStatus,
  type PublishParams,
} from "@/ApiClient";
import LocalAuthenticator from "@/authn/LocalAuthenticator";
import { PrivateKey } from "@/crypto/PrivateKey";
import { dateToNs } from "@/utils/date";
// eslint-disable-next-line no-restricted-syntax
import packageJson from "../package.json";
import { sleep } from "./helpers";

const { MessageApi } = messageApi;

const PATH_PREFIX = "http://fake:5050";
const CURSOR: messageApi.Cursor = {
  index: {
    digest: Uint8Array.from([1, 2, 3]),
    senderTimeNs: "3",
  },
};
const CONTENT_TOPIC = "foo";
const AUTH_TOKEN = "foo";

const client = new ApiClient(PATH_PREFIX);

const mockGetToken = vi.hoisted(() =>
  vi.fn().mockReturnValue(
    Promise.resolve({
      toBase64: () => AUTH_TOKEN,
      age: 10,
    }),
  ),
);
vi.mock("@/authn/LocalAuthenticator", () => {
  return {
    default: vi.fn().mockImplementation(() => {
      return { createToken: mockGetToken };
    }),
  };
});

describe("Query", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stops when receiving empty results", async () => {
    const apiMock = createQueryMock([], 1);
    const result = await client.query({ contentTopic: CONTENT_TOPIC }, {});
    expect(result).toHaveLength(0);
    expect(apiMock).toHaveBeenCalledTimes(1);
    const expectedReq: messageApi.QueryRequest = {
      contentTopics: ["foo"],
      pagingInfo: {
        direction: messageApi.SortDirection.SORT_DIRECTION_ASCENDING,
        limit: 100,
      },
    };
    expect(apiMock).toHaveBeenCalledWith(expectedReq, {
      pathPrefix: PATH_PREFIX,
      mode: "cors",
      headers: new Headers({
        "X-Client-Version": "xmtp-js/" + packageJson.version,
      }),
    });
  });

  it("stops when limit is used", async () => {
    const apiMock = createQueryMock([createEnvelope()], 3);
    const result = await client.query(
      { contentTopic: CONTENT_TOPIC },
      { limit: 2 },
    );
    expect(result).toHaveLength(2);
    expect(apiMock).toHaveBeenCalledTimes(2);
  });

  it("stops when receiving some results and a null cursor", async () => {
    const apiMock = createQueryMock([createEnvelope()], 1);
    const result = await client.query({ contentTopic: CONTENT_TOPIC }, {});
    expect(result).toHaveLength(1);
    expect(apiMock).toHaveBeenCalledTimes(1);
  });

  it("gets multiple pages of results", async () => {
    const apiMock = createQueryMock([createEnvelope(), createEnvelope()], 2);
    const result = await client.query({ contentTopic: CONTENT_TOPIC }, {});
    expect(result).toHaveLength(4);
    expect(apiMock).toHaveBeenCalledTimes(2);
  });

  it("streams a single page of results", async () => {
    const apiMock = createQueryMock([createEnvelope(), createEnvelope()], 1);
    let count = 0;
    for await (const _envelope of client.queryIterator(
      { contentTopic: "foo" },
      { pageSize: 5 },
    )) {
      count++;
    }
    expect(count).toBe(2);
    expect(apiMock).toHaveBeenCalledTimes(1);

    const expectedReq: messageApi.QueryRequest = {
      contentTopics: ["foo"],
      pagingInfo: {
        limit: 5,
      },
    };
    expect(apiMock).toHaveBeenCalledWith(expectedReq, {
      pathPrefix: PATH_PREFIX,
      mode: "cors",
      headers: new Headers({
        "X-Client-Version": "xmtp-js/" + packageJson.version,
      }),
    });
  });

  it("streams multiple pages of results", async () => {
    const apiMock = createQueryMock([createEnvelope(), createEnvelope()], 2);
    let count = 0;
    for await (const _envelope of client.queryIterator(
      { contentTopic: CONTENT_TOPIC },
      { pageSize: 5 },
    )) {
      count++;
    }
    expect(count).toBe(4);
    expect(apiMock).toHaveBeenCalledTimes(2);

    const expectedReq: messageApi.QueryRequest = {
      contentTopics: [CONTENT_TOPIC],
      pagingInfo: {
        limit: 5,
        cursor: CURSOR,
      },
    };
    expect(apiMock).toHaveBeenLastCalledWith(expectedReq, {
      pathPrefix: PATH_PREFIX,
      mode: "cors",
      headers: new Headers({
        "X-Client-Version": "xmtp-js/" + packageJson.version,
      }),
    });
  });
});

describe("Publish", () => {
  const publishMock = createPublishMock();
  let publishClient: ApiClient;

  beforeEach(() => {
    publishMock.mockClear();
    publishClient = new ApiClient(PATH_PREFIX, { appVersion: "test/0.0.0" });
  });

  it("publishes valid messages", async () => {
    // This Authenticator will not actually be used by the mock
    publishClient.setAuthenticator(
      new LocalAuthenticator(PrivateKey.generate()),
    );

    const now = new Date();
    const msg: PublishParams = {
      timestamp: now,
      message: Uint8Array.from([1, 2, 3]),
      contentTopic: CONTENT_TOPIC,
    };

    await publishClient.publish([msg]);
    expect(publishMock).toHaveBeenCalledTimes(1);
    const expectedRequest: messageApi.PublishRequest = {
      envelopes: [
        {
          message: msg.message,
          contentTopic: msg.contentTopic,
          timestampNs: dateToNs(now).toString(),
        },
      ],
    };
    expect(publishMock).toHaveBeenCalledWith(expectedRequest, {
      pathPrefix: PATH_PREFIX,
      mode: "cors",
      headers: new Headers({
        "X-Client-Version": "xmtp-js/" + packageJson.version,
        "X-App-Version": "test/0.0.0",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      }),
    });
  });

  it("throws on invalid message", () => {
    const promise = client.publish([
      {
        contentTopic: "",
        message: Uint8Array.from([]),
      },
    ]);
    expect(promise).rejects.toThrow("Content topic cannot be empty string");
  });
});

describe("Publish authn", () => {
  let publishClient: ApiClient;

  beforeEach(() => {
    publishClient = new ApiClient(PATH_PREFIX);
  });

  it("retries on invalid message", async () => {
    const publishMock = createAuthErrorPublishMock(1);
    publishClient.setAuthenticator(
      new LocalAuthenticator(PrivateKey.generate()),
    );

    const now = new Date();
    const msg: PublishParams = {
      timestamp: now,
      message: Uint8Array.from([1, 2, 3]),
      contentTopic: CONTENT_TOPIC,
    };
    await publishClient.publish([msg]);
    expect(publishMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after a second auth error", async () => {
    const publishMock = createAuthErrorPublishMock(5);
    publishClient.setAuthenticator(
      new LocalAuthenticator(PrivateKey.generate()),
    );

    const now = new Date();
    const msg: PublishParams = {
      timestamp: now,
      message: Uint8Array.from([1, 2, 3]),
      contentTopic: CONTENT_TOPIC,
    };

    try {
      await publishClient.publish([msg]);
    } catch (e: any) {
      expect(e.code).toBe(GrpcStatus.UNAUTHENTICATED);
    }

    expect(publishMock).toHaveBeenCalledTimes(2);
  });
});

describe("Subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("can subscribe", async () => {
    const subscribeMock = createSubscribeMock(2);
    let numEnvelopes = 0;
    const cb = () => {
      numEnvelopes++;
    };
    const req = { contentTopics: [CONTENT_TOPIC] };
    const subscriptionManager = client.subscribe(req, cb);
    await sleep(10);
    expect(numEnvelopes).toBe(2);
    expect(subscribeMock).toBeCalledWith(req, expect.anything(), {
      pathPrefix: PATH_PREFIX,
      signal: expect.anything(),
      mode: "cors",
      headers: new Headers({
        "X-Client-Version": "xmtp-js/" + packageJson.version,
      }),
    });
    await subscriptionManager.unsubscribe();
  });

  it("should resubscribe on error", async () => {
    let called = 0;
    const subscribeMock = vi
      .spyOn(MessageApi, "Subscribe")
      .mockImplementation(
        async (
          req: messageApi.SubscribeRequest,
          cb: NotifyStreamEntityArrival<messageApi.Envelope> | undefined,
          initReq?: InitReq,
        ): Promise<void> => {
          // We mock a connection stream that immediately errors the first time
          // it is called. The second time it is called, it behaves as expected (the connection
          // stays open, and two messages are received over the subscription)
          called++;
          if (called === 1) {
            throw new Error("error");
          }
          const nonErroringSubscribe = subscribeMockImplementation(2);
          return await nonErroringSubscribe(req, cb, initReq);
        },
      );
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});
    let numEnvelopes = 0;
    const cb = () => {
      numEnvelopes++;
    };
    let numDisconnects = 0;
    const onDisconnect = () => {
      numDisconnects++;
    };
    const req = { contentTopics: [CONTENT_TOPIC] };
    const subscriptionManager = client.subscribe(req, cb, onDisconnect);
    await sleep(1200);
    expect(numEnvelopes).toBe(2);
    expect(numDisconnects).toBe(1);
    // Resubscribing triggers an info log
    expect(consoleInfo).toBeCalledTimes(1);
    expect(subscribeMock).toBeCalledTimes(2);
    expect(subscribeMock).toBeCalledWith(req, expect.anything(), {
      pathPrefix: PATH_PREFIX,
      signal: expect.anything(),
      mode: "cors",
      headers: new Headers({
        "X-Client-Version": "xmtp-js/" + packageJson.version,
      }),
    });
    consoleInfo.mockRestore();
    await subscriptionManager.unsubscribe();
  });

  it("should resubscribe on completion", async () => {
    let called = 0;
    const subscribeMock = vi
      .spyOn(MessageApi, "Subscribe")
      .mockImplementation(
        async (
          req: messageApi.SubscribeRequest,
          cb: NotifyStreamEntityArrival<messageApi.Envelope> | undefined,
          initReq?: InitReq,
        ): Promise<void> => {
          // We mock a connection stream that immediately terminates the first time
          // it is called. The second time it is called, it behaves as expected (the connection
          // stays open, and two messages are received over the subscription)
          called++;
          if (called === 1) {
            return;
          }
          const nonAbortingSubscribe = subscribeMockImplementation(2);
          return await nonAbortingSubscribe(req, cb, initReq);
        },
      );
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});
    let numEnvelopes = 0;
    const cb = () => {
      numEnvelopes++;
    };
    const req = { contentTopics: [CONTENT_TOPIC] };
    const subscriptionManager = client.subscribe(req, cb);
    await sleep(1200);
    expect(numEnvelopes).toBe(2);
    // Resubscribing triggers an info log
    expect(consoleInfo).toBeCalledTimes(1);
    expect(subscribeMock).toBeCalledTimes(2);
    expect(subscribeMock).toBeCalledWith(req, expect.anything(), {
      pathPrefix: PATH_PREFIX,
      signal: expect.anything(),
      mode: "cors",
      headers: new Headers({
        "X-Client-Version": "xmtp-js/" + packageJson.version,
      }),
    });
    consoleInfo.mockRestore();
    await subscriptionManager.unsubscribe();
  });

  it("throws when no content topics returned", async () => {
    createSubscribeMock(2);
    const cb = () => {};
    const req = { contentTopics: [] };
    const t = () => client.subscribe(req, cb);
    expect(t).toThrow(
      new Error("Must provide list of contentTopics to subscribe to"),
    );
  });
});

function createQueryMock(envelopes: messageApi.Envelope[], numPages = 1) {
  let numCalls = 0;
  return vi
    .spyOn(MessageApi, "Query")
    .mockImplementation(async (): Promise<messageApi.QueryResponse> => {
      numCalls++;
      return {
        envelopes,
        pagingInfo: {
          cursor: numCalls >= numPages ? undefined : CURSOR,
        },
      };
    });
}

function createPublishMock() {
  return vi
    .spyOn(MessageApi, "Publish")
    .mockImplementation(async (): Promise<messageApi.PublishResponse> => ({}));
}

function createAuthErrorPublishMock(rejectTimes = 1) {
  let numRejections = 0;
  return vi
    .spyOn(MessageApi, "Publish")
    .mockImplementation(async (): Promise<messageApi.PublishResponse> => {
      if (numRejections < rejectTimes) {
        numRejections++;
        throw GrpcError.fromObject({
          code: 16,
          message: "UNAUTHENTICATED",
        });
      }

      return {};
    });
}

function createSubscribeMock(numMessages: number) {
  return vi
    .spyOn(MessageApi, "Subscribe")
    .mockImplementation(subscribeMockImplementation(numMessages));
}

// Subscribes to a connection stream that pushes down the number of messages specified.
// The connection stream is expected to stay open until it is closed by an unsubscribe
// request (which is reflected by the 'onabort' signal)
function subscribeMockImplementation(numMessages: number) {
  const subscribe = async (
    req: messageApi.SubscribeRequest,
    cb: NotifyStreamEntityArrival<messageApi.Envelope> | undefined,
    initReq?: InitReq,
  ): Promise<void> => {
    for (let i = 0; i < numMessages; i++) {
      if (cb) {
        cb(createEnvelope());
      }
    }
    // Connection stream is expected to stay open until terminated
    const connectionClosePromise = new Promise((resolve) => {
      initReq!.signal!.onabort = () => resolve(null);
    });
    await connectionClosePromise;
  };
  return subscribe;
}

function createEnvelope(): messageApi.Envelope {
  return {
    contentTopic: CONTENT_TOPIC,
    timestampNs: "1",
    message: Uint8Array.from([1, 2, 3]),
  };
}
