import { Utils, type XmtpEnv } from "@xmtp/browser-sdk";
import { isValidEthereumAddress } from "@/helpers/strings";

const utils = new Utils();

export const resolveName = async (name: string) => {
  console.log("resolving name", name);
  console.log(JSON.stringify({ name }));
  const response = await fetch(
    `${import.meta.env.VITE_API_SERVICE_URL}/api/v1/resolve/name/${name}`,
    {
      method: "GET",
    },
  );
  const data = (await response.json()) as { address: string | null };
  return data.address;
};

export const getInboxIdForAddress = async (
  address: string,
  environment: XmtpEnv,
): Promise<string | undefined> => {
  if (!isValidEthereumAddress(address)) {
    return undefined;
  }

  const inboxId = await utils.getInboxIdForIdentifier(
    {
      identifier: address.toLowerCase(),
      identifierKind: "Ethereum",
    },
    environment,
  );

  return inboxId;
};
