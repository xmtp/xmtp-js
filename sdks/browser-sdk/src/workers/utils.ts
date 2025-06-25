import init, {
  applySignatureRequest,
  generateInboxId,
  getInboxIdForIdentifier as get_inbox_id_for_identifier,
  inboxStateFromInboxIds,
  revokeInstallationsSignatureRequest,
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
import { toSafeInboxState } from "@/utils/conversions";

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
      case "utils.revokeInstallationsSignatureText": {
        const host = ApiUrls[data.env ?? "dev"];
        const signatureRequest = await revokeInstallationsSignatureRequest(
          host,
          data.identifier,
          data.inboxId,
          data.installationIds,
        );
        const signatureText = await signatureRequest.signatureText();
        postMessage({ id, action, result: signatureText });
        break;
      }
      case "utils.revokeInstallations": {
        const host = ApiUrls[data.env ?? "dev"];
        const signatureRequest = await revokeInstallationsSignatureRequest(
          host,
          data.signer.identifier,
          data.inboxId,
          data.installationIds,
        );
        switch (data.signer.type) {
          case "EOA":
            await signatureRequest.addEcdsaSignature(data.signer.signature);
            break;
          case "SCW":
            await signatureRequest.addScwSignature(
              data.signer.identifier,
              data.signer.signature,
              data.signer.chainId,
              data.signer.blockNumber,
            );
            break;
        }
        await applySignatureRequest(host, signatureRequest);
        postMessage({ id, action, result: undefined });
        break;
      }
      case "utils.inboxStateFromInboxIds": {
        const host = ApiUrls[data.env ?? "dev"];
        const inboxStates = await inboxStateFromInboxIds(host, data.inboxIds);
        const result = inboxStates.map((inboxState) =>
          toSafeInboxState(inboxState),
        );
        postMessage({ id, action, result });
        break;
      }
    }
  } catch (e) {
    postMessageError({ id, action, error: e as Error });
  }
};
