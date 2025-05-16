import init, {
  generateInboxId,
  getInboxIdForIdentifier as get_inbox_id_for_identifier,
  type Identifier,
} from "@xmtp/wasm-bindings";
import { ApiUrls } from "@/constants";
import type {
  ActionErrorData,
  ActionName,
  ActionWithoutResult,
  ExtractActionWithoutData,
} from "@/types/actions";
import type { UtilsWorkerAction } from "@/types/actions/utils";
import type { XmtpEnv } from "@/types/options";

/**
 * Type-safe postMessage
 */
const postMessage = <A extends ActionName<UtilsWorkerAction>>(
  data: ExtractActionWithoutData<UtilsWorkerAction, A>,
) => {
  self.postMessage(data);
};

/**
 * Type-safe postMessage for errors
 */
const postMessageError = (data: ActionErrorData<UtilsWorkerAction>) => {
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

self.onmessage = async (
  event: MessageEvent<ActionWithoutResult<UtilsWorkerAction>>,
) => {
  const { action, id, data } = event.data;

  if (enableLogging) {
    console.log("utils worker received event data", event.data);
  }

  // initialize WASM module
  await init();

  try {
    switch (action) {
      case "utils.init": {
        enableLogging = data.enableLogging;
        postMessage({ id, action, result: undefined });
        break;
      }
      case "utils.generateInboxId": {
        const result = generateInboxId(data.identifier);
        postMessage({
          id,
          action,
          result,
        });
        break;
      }
      case "utils.getInboxIdForIdentifier": {
        const result = await getInboxIdForIdentifier(data.identifier, data.env);
        postMessage({ id, action, result });
        break;
      }
    }
  } catch (e) {
    postMessageError({ id, action, error: e as Error });
  }
};
