import { Utils, type XmtpEnv } from "@xmtp/browser-sdk";
import { queryClient } from "@/helpers/queries";
import { isValidEthereumAddress } from "@/helpers/strings";
import { profilesStore, type Profile } from "@/stores/profiles";

const utils = new Utils();

export const isValidName = (name: string): name is string =>
  /^_?[a-zA-Z0-9-]+(\.base)?\.eth$/i.test(name);

export const normalizeName = (name: string) => {
  return name.toLowerCase().replace(/\s/g, "");
};

export const resolveNameQuery = async (name: string) => {
  return queryClient.fetchQuery({
    queryKey: ["resolveName", name],
    queryFn: () => resolveName(name),
    // do not re-query the name for this session
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const resolveName = async (name: string, force: boolean = false) => {
  if (!isValidName(name)) {
    return null;
  }

  const normalizedName = normalizeName(name);

  // check cached profiles
  const cachedProfiles = profilesStore
    .getState()
    .getProfilesByName(normalizedName);
  if (!force && cachedProfiles.length > 0) {
    return cachedProfiles;
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_SERVICE_URL}/api/v2/resolve/name/${window.encodeURIComponent(normalizedName)}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    return cachedProfiles;
  }

  const data = (await response.json()) as { profiles: Profile[] };

  if (data.profiles.length > 0) {
    // cache the profiles
    profilesStore.getState().addProfiles(data.profiles);
  }

  // return updated cached profiles
  return profilesStore.getState().getProfilesByName(normalizedName);
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
): Promise<string | null> => {
  if (!isValidEthereumAddress(address)) {
    return null;
  }

  const inboxId = await utils.getInboxIdForIdentifier(
    {
      identifier: address.toLowerCase(),
      identifierKind: "Ethereum",
    },
    environment,
  );

  return inboxId ?? null;
};
