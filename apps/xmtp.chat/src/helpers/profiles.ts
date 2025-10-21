import {
  createEmptyProfile,
  profilesStore,
  type Profile,
} from "@/stores/profiles";

export const resolveAddresses = async (addresses: string[], force = false) => {
  // check if any of the addresses are cached
  const cachedProfiles = profilesStore.getState().findProfiles(addresses);
  const unresolvedAddresses = addresses.filter(
    (address) => !cachedProfiles.has(address),
  );

  if (!force && unresolvedAddresses.length === 0) {
    return cachedProfiles;
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_SERVICE_URL}/api/v1/resolve/profiles`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        addresses: force ? addresses : unresolvedAddresses,
      }),
    },
  );

  if (!response.ok) {
    // failed to resolve addresses, return the cached profiles
    return cachedProfiles;
  }

  const data = (await response.json()) as {
    profiles: Profile[];
  };

  // addresses that don't have web3 profiles
  const missingProfiles = unresolvedAddresses.filter(
    (address) => !data.profiles.some((profile) => profile.address === address),
  );

  // add empty profiles for addresses that don't have web3 profiles so that
  // we don't try to resolve them again in this session
  missingProfiles.forEach((address) => {
    data.profiles.push(createEmptyProfile(address));
  });

  if (data.profiles.length > 0) {
    // cache the profiles
    profilesStore.getState().addProfiles(data.profiles);
  }

  // return updated cached profiles
  return profilesStore.getState().findProfiles(addresses);
};
