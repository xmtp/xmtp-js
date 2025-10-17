import { escape } from "node:querystring";
import type { NSResponse, ProfileResponse } from "web3bio-profile-kit/types";
import { isValidEthereumAddress } from "web3bio-profile-kit/utils";
import { z } from "zod";

const WEB3BIO_API_ENDPOINT = "https://api.web3.bio";
const WEB3BIO_BATCH_SIZE = 30;

const validateName = (name: string) => {
  return name.endsWith(".eth") || name.endsWith(".base.eth");
};

const web3BioErrorResponseSchema = z.object({
  status: z.number(),
  statusText: z.string(),
});

const isWeb3BioErrorResponse = (
  response: unknown,
): response is z.infer<typeof web3BioErrorResponseSchema> => {
  return web3BioErrorResponseSchema.safeParse(response).success;
};

const fetchFromWeb3Bio = async <T>(path: string) => {
  const endpoint = `${WEB3BIO_API_ENDPOINT}${path}`;
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "X-API-KEY": `Bearer ${process.env.WEB3BIO_API_KEY}`,
      },
    });

    if (!response.ok) {
      return {
        status: response.status,
        statusText: response.statusText,
      };
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
};

export const fetchProfiles = async (input: string[]) => {
  // validate input
  const identities = input.filter(isValidNameInput);

  // if no identities, return empty array
  if (identities.length === 0) {
    return [];
  }

  const escapedIdentities = escape(JSON.stringify(identities));
  return (
    (await fetchFromWeb3Bio<ProfileResponse[]>(
      `/profile/batch/${escapedIdentities}`,
    )) ?? []
  );
};

export const batchFetchProfiles = async (input: string[]) => {
  // validate input
  const identities = input.filter(isValidNameInput);

  // if no identities, return empty array
  if (identities.length === 0) {
    return [];
  }

  const profiles: ProfileResponse[] = [];

  // fetch profiles in batches
  while (identities.length > 0) {
    const batch = identities.splice(0, WEB3BIO_BATCH_SIZE);
    const batchProfiles = await fetchProfiles(batch);
    if (isWeb3BioErrorResponse(batchProfiles)) {
      console.error(
        `Error fetching profiles: ${batchProfiles.status} ${batchProfiles.statusText}`,
      );
      continue;
    }
    profiles.push(...batchProfiles);
  }

  return profiles;
};

export const fetchProfile = async (identity: string) => {
  if (!identity) {
    return null;
  }
  return await fetchFromWeb3Bio<ProfileResponse>(
    `/profile/${escape(identity)}`,
  );
};

export const fetchProfilesFromName = async (name: string) => {
  if (!name || !validateName(name)) {
    return null;
  }
  const response = await fetchFromWeb3Bio<NSResponse[]>(`/ns/${escape(name)}`);
  if (isWeb3BioErrorResponse(response)) {
    console.error(
      `Error fetching address: ${response.status} ${response.statusText}`,
    );
    return null;
  }
  return response;
};

export const isValidNameInput = (input: string) => {
  const [type, address] = input.split(",");
  return (
    (type === "ens" || type === "basenames") && isValidEthereumAddress(address)
  );
};

export const fetchNames = async (input: string[]) => {
  // validate input
  const identities = input.filter(isValidNameInput);

  // if no identities, return empty array
  if (identities.length === 0) {
    return [];
  }

  const escapedNames = escape(JSON.stringify(identities));
  return (
    (await fetchFromWeb3Bio<NSResponse[]>(`/ns/batch/${escapedNames}`)) ?? []
  );
};

export const batchFetchNames = async (input: string[]) => {
  // validate input
  const identities = input.filter(isValidNameInput);

  // if no identities, return empty array
  if (identities.length === 0) {
    return [];
  }

  const names: NSResponse[] = [];

  // fetch names in batches
  while (identities.length > 0) {
    const batch = identities.splice(0, WEB3BIO_BATCH_SIZE);
    const batchNames = await fetchNames(batch);
    if (isWeb3BioErrorResponse(batchNames)) {
      console.error(
        `Error fetching names: ${batchNames.status} ${batchNames.statusText}`,
      );
      continue;
    }
    names.push(...batchNames);
  }

  return names;
};
