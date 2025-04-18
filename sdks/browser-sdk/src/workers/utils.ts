import init, {
  generateInboxId,
  getInboxIdForIdentifier as get_inbox_id_for_identifier,
  type Identifier,
} from "@xmtp/wasm-bindings";
import { ApiUrls } from "@/constants";
import type {
  UtilsEventsActions,
  UtilsEventsClientMessageData,
  UtilsEventsErrorData,
  UtilsEventsWorkerPostMessageData,
  XmtpEnv,
} from "@/types";

/**
 * Type-safe postMessage
 */
const postMessage = <A extends UtilsEventsActions>(
  data: UtilsEventsWorkerPostMessageData<A>,
) => {
  self.postMessage(data);
};

/**
 * Type-safe postMessage for errors
 */
const postMessageError = (data: UtilsEventsErrorData) => {
  self.postMessage(data);
};

const getInboxIdForIdentifier = async (
  identifier: Identifier,
  env?: XmtpEnv,
) => {
  const host = env ? ApiUrls[env] : ApiUrls.dev;
  return get_inbox_id_for_identifier(host, identifier);
};

let enableLogging = false;

self.onmessage = async (event: MessageEvent<UtilsEventsClientMessageData>) => {
  const { action, id, data } = event.data;

  if (enableLogging) {
    console.log("utils worker received event data", event.data);
  }

  // initialize WASM module
  await init();

  try {
    switch (action) {
      case "init":
        enableLogging = data.enableLogging;
        postMessage({
          id,
          action,
          result: undefined,
        });
        break;
      case "generateInboxId":
        postMessage({
          id,
          action,
          result: generateInboxId(data.identifier),
        });
        break;
      case "getInboxIdForIdentifier":
        postMessage({
          id,
          action,
          result: await getInboxIdForIdentifier(data.identifier, data.env),
        });
        break;
    }
  } catch (e) {
    postMessageError({
      id,
      action,
      error: e as Error,
    });
  }
};
