import init, {
  generateInboxId as generate_inbox_id,
  getInboxIdForAddress as get_inbox_id_for_address,
} from "@xmtp/client-bindings-wasm";
import type {
  UtilsEventsErrorData,
  UtilsEventsActions,
  UtilsEventsWorkerPostMessageData,
  UtilsEventsClientMessageData,
  XmtpEnv,
} from "@/types";
import { ApiUrls } from "@/constants";

/**
 * Type-safe postMessage
 */
const postMessage = <A extends UtilsEventsActions>(
  data: UtilsEventsWorkerPostMessageData<A>,
) => {
  // eslint-disable-next-line no-restricted-globals
  self.postMessage(data);
};

/**
 * Type-safe postMessage for errors
 */
const postMessageError = (data: UtilsEventsErrorData) => {
  // eslint-disable-next-line no-restricted-globals
  self.postMessage(data);
};

export const generateInboxId = async (address: string) => {
  await init();
  return generate_inbox_id(address);
};

export const getInboxIdForAddress = async (address: string, env?: XmtpEnv) => {
  await init();
  const host = env ? ApiUrls[env] : ApiUrls.dev;
  return get_inbox_id_for_address(host, address);
};

// eslint-disable-next-line no-restricted-globals
self.onmessage = async (event: MessageEvent<UtilsEventsClientMessageData>) => {
  const { action, id, data } = event.data;
  // eslint-disable-next-line no-console
  console.log("utils worker received event data", event.data);

  try {
    switch (action) {
      case "generateInboxId":
        postMessage({
          id,
          action,
          result: await generateInboxId(data.address),
        });
        break;
      case "getInboxIdForAddress":
        postMessage({
          id,
          action,
          result: await getInboxIdForAddress(data.address, data.env),
        });
        break;
      // no default
    }
  } catch (e) {
    postMessageError({
      id,
      action,
      error: (e as Error).message,
    });
  }
};
