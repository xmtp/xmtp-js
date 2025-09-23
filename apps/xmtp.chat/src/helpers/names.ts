import { Utils, type XmtpEnv } from "@xmtp/browser-sdk";
import { queryClient } from "@/helpers/queries";
import { isValidEthereumAddress } from "@/helpers/strings";

const utils = new Utils();

export const isValidName = (name: string): name is string =>
  /^_?[a-zA-Z0-9-]+(\.base)?\.eth$/.test(name);

export const resolveNameQuery = async (name: string) => {
  return queryClient.fetchQuery({
    queryKey: ["resolveName", name],
    queryFn: () => resolveName(name),
    // do not re-query the name for this session
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const resolveName = async (name: string) => {
  if (!isValidName(name)) {
    return null;
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_SERVICE_URL}/api/v1/resolve/name/${window.encodeURIComponent(name)}`,
    {
      method: "GET",
    },
  );
  const data = (await response.json()) as { address: string | null };

  return data.address;
};

export const getInboxIdForAddressQuery = async (
  address: string,
  environment: XmtpEnv,
) => {
  return queryClient.fetchQuery({
    queryKey: ["getInboxIdForAddress", address, environment],
    queryFn: () => getInboxIdForAddress(address, environment),
    // do not re-query the address for this session
    staleTime: Infinity,
    gcTime: Infinity,
  });
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
