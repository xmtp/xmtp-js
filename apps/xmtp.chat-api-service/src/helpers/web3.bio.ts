import { escape } from "node:querystring";
import type { NSResponse, ProfileResponse } from "web3bio-profile-kit/types";
import { resolveIdentity } from "web3bio-profile-kit/utils";
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

export const fetchAddress = async (name: string) => {
  if (!name || !validateName(name)) {
    return null;
  }
  const profiles = await fetchFromWeb3Bio<NSResponse[]>(`/ns/${escape(name)}`);
  if (isWeb3BioErrorResponse(profiles)) {
    console.error(
      `Error fetching address: ${profiles.status} ${profiles.statusText}`,
    );
    return null;
  }
  return profiles.length > 0 ? profiles[0].address : null;
};
