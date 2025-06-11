import { ContentTypeMiniApp } from "./MiniApp";
import type {
  ButtonAction,
  ButtonActionHandler,
  DataAction,
} from "./types/actions";
import type { MiniAppResponseContent } from "./types/content";

const isPlainObject = (obj: unknown): obj is Record<string, unknown> => {
  return (
    Object.prototype.toString.call(obj) === "[object Object]" &&
    [null, Object.prototype].includes(
      Object.getPrototypeOf(obj) as object | null,
    )
  );
};

export type ValidValue = string | number | boolean | null;
export type ValidData = ValidValue | ValidValue[] | Record<string, ValidValue>;
export type UIData = Record<string, ValidData>;
export type InputData = Record<string, ValidData>;

const uiDataReferenceRegex = /^\$[a-zA-Z0-9]+$/;
const inputDataReferenceRegex = /^#[a-zA-Z0-9]+$/;

export const hydrateValue = (
  value: ValidData,
  uiData: UIData | undefined,
  inputData: InputData | undefined,
): ValidData | ValidData[] | Record<string, ValidData> => {
  if (typeof value === "string") {
    if (uiData && uiDataReferenceRegex.test(value)) {
      // if the value can't be found in the data, return the original value
      return uiData[value.slice(1)] ?? value;
    }
    if (inputData && inputDataReferenceRegex.test(value)) {
      // if the value can't be found in the data, return the original value
      return inputData[value.slice(1)] ?? value;
    }
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      hydrateValue(item, uiData, inputData),
    ) as ValidData[];
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, value]) => [
        key,
        hydrateValue(value, uiData, inputData),
      ]),
    ) as Record<string, ValidData>;
  }
  return value;
};

export const hydrateActionData = (
  action: ButtonAction,
  uiData: UIData | undefined,
  inputData: InputData | undefined,
) => hydrateValue(action.payload, uiData, inputData);

export const defaultDataActionHandler: ButtonActionHandler<DataAction> = async (
  data,
  content,
  client,
  senderInboxId,
) => {
  const message: MiniAppResponseContent = {
    type: "response",
    metadata: {
      id: content.metadata?.id,
    },
    uuid: content.action.payload.uuid,
    data,
  };
  const dm = await client.conversations.newDm(senderInboxId);
  await dm.send(message, ContentTypeMiniApp);
};
