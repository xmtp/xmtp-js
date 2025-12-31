import init, {
  opfsClearAll,
  opfsDeleteFile,
  opfsExportDb,
  opfsFileCount,
  opfsFileExists,
  opfsImportDb,
  opfsInit,
  opfsListFiles,
  opfsPoolCapacity,
} from "@xmtp/wasm-bindings";
import type {
  ActionErrorData,
  ActionName,
  ActionWithoutResult,
  ExtractActionWithoutData,
} from "@/types/actions";
import type { OpfsAction } from "@/types/actions/opfs";
import {
  OpfsInitializationError,
  OpfsNotInitializedError,
} from "@/utils/errors";

let initialized = false;
let enableLogging = false;

/**
 * Type-safe postMessage
 */
const postMessage = <A extends ActionName<OpfsAction>>(
  data: ExtractActionWithoutData<OpfsAction, A>,
) => {
  self.postMessage(data);
};

/**
 * Type-safe postMessage for errors
 */
const postMessageError = (data: ActionErrorData<OpfsAction>) => {
  self.postMessage(data);
};

self.onmessage = async (
  event: MessageEvent<ActionWithoutResult<OpfsAction>>,
) => {
  const { action, id, data } = event.data;

  // initialize WASM module
  await init();

  try {
    // init is a special action that initializes the client
    if (action === "opfs.init" && !initialized) {
      try {
        await opfsInit();
      } catch {
        throw new OpfsInitializationError();
      }
      initialized = true;
      enableLogging = data.enableLogging ?? false;
      postMessage({ id, action, result: undefined });
    }

    if (enableLogging) {
      console.log("[worker] worker received event data", event.data);
    }

    // nothing else to do
    if (action === "opfs.init") {
      return;
    }

    // OPFS must be initialized for all other actions
    if (!initialized) {
      throw new OpfsNotInitializedError();
    }

    switch (action) {
      case "opfs.listFiles": {
        const files = await opfsListFiles();
        postMessage({ id, action, result: files });
        return;
      }
      case "opfs.fileCount": {
        const fileCount = await opfsFileCount();
        postMessage({ id, action, result: fileCount });
        return;
      }
      case "opfs.poolCapacity": {
        const poolCapacity = await opfsPoolCapacity();
        postMessage({ id, action, result: poolCapacity });
        return;
      }
      case "opfs.fileExists": {
        const fileExists = await opfsFileExists(data.path);
        postMessage({ id, action, result: fileExists });
        return;
      }
      case "opfs.deleteFile": {
        const deleted = await opfsDeleteFile(data.path);
        postMessage({ id, action, result: deleted });
        return;
      }
      case "opfs.exportDb": {
        const db = await opfsExportDb(data.path);
        postMessage({ id, action, result: db });
        return;
      }
      case "opfs.importDb": {
        await opfsImportDb(data.path, data.data);
        postMessage({ id, action, result: undefined });
        return;
      }
      case "opfs.clearAll": {
        await opfsClearAll();
        postMessage({ id, action, result: undefined });
        return;
      }
    }
  } catch (e) {
    postMessageError({
      id,
      action,
      error: e as Error,
    });
  }
};
