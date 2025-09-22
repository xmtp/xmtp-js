import { escape } from "node:querystring";
import type { NSResponse, ProfileResponse } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";

const WEB3BIO_API_ENDPOINT = "https://api.web3.bio";
const WEB3BIO_BATCH_SIZE = 30;

const validateName = (name: string) => {
  return name.endsWith(".eth") || name.endsWith(".base.eth");
};

const fetchFromWeb3Bio = async <T>(path: string) => {
  const response = await fetch(`${WEB3BIO_API_ENDPOINT}${path}`, {
    method: "GET",
    headers: {
      "X-API-KEY": `Bearer ${process.env.WEB3BIO_API_KEY}`,
    },
  });
  return response.json() as Promise<T>;
};

export const fetchProfiles = async (identities: string[]) => {
  if (identities.length === 0) {
    return [];
  }
  const escapedIdentities = escape(JSON.stringify(identities));
  return await fetchFromWeb3Bio<ProfileResponse[]>(
    `/profile/batch/${escapedIdentities}`,
  );
};

export const batchFetchProfiles = async (input: string[]) => {
  // convert input to identities
  const identities = input
    .map((v) => resolveIdentity(v))
    .filter((v) => v !== null);

  // if no identities, return empty array
  if (identities.length === 0) {
    return [];
  }

  const profiles: ProfileResponse[] = [];

  // fetch profiles in batches
  while (identities.length > 0) {
    const batch = identities.splice(0, WEB3BIO_BATCH_SIZE);
    profiles.push(...(await fetchProfiles(batch)));
  }

  return profiles;
};

export const fetchProfile = async (identity: string) => {
  if (!identity) {
    return null;
  }
  return await fetchFromWeb3Bio<ProfileResponse>(`/profile/${identity}`);
};

export const fetchAddress = async (name: string) => {
  if (!name || !validateName(name)) {
    return null;
  }
  const profiles = await fetchFromWeb3Bio<NSResponse[]>(`/ns/${name}`);
  return profiles.length > 0 ? profiles[0].address : null;
};
