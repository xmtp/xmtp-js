import { useMemo } from "react";
import { createStore, useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";

export type Platform = "unknown" | "ens" | "basenames";

const VALID_PLATFORMS: Platform[] = ["ens", "basenames"];

export type Profile = {
  address: string;
  avatar: string | null;
  description: string | null;
  displayName: string | null;
  platform: Platform | null;
  identity: string | null;
};

export const createEmptyProfile = (address: string): Profile => ({
  address,
  avatar: null,
  description: null,
  displayName: null,
  platform: null,
  identity: null,
});

// alias types for clarity
type DisplayName = string;
type Address = string;

export type ProfilesState = {
  profiles: Map<Address, Profile[]>;
  names: Map<DisplayName, Address>;
};

export type ProfilesActions = {
  addProfile: (profile: Profile) => void;
  addProfiles: (profiles: Profile[]) => void;
  findProfiles: (addresses: string[]) => Map<string, Profile[]>;
  getProfiles: (address: string) => Profile[];
  hasProfile: (address: string) => boolean;
  getProfilesByName: (name: string) => Profile[];
  reset: () => void;
};

const EMPTY_PROFILES: Profile[] = [];

export const profilesStore = createStore<ProfilesState & ProfilesActions>()(
  (set, get, store) => ({
    profiles: new Map(),
    names: new Map(),
    addProfile: (profile: Profile) => {
      if (!profile.platform || !VALID_PLATFORMS.includes(profile.platform)) {
        return;
      }
      const state = get();
      const newNames = new Map(state.names);
      const newProfiles = new Map(state.profiles);
      const existingProfiles = state.profiles.get(profile.address) ?? [];
      newProfiles.set(profile.address, [...existingProfiles, profile]);
      if (profile.identity) {
        newNames.set(profile.identity, profile.address);
      }
      set(() => ({
        profiles: newProfiles,
        names: newNames,
      }));
    },
    addProfiles: (profiles: Profile[]) => {
      const state = get();
      const newNames = new Map(state.names);
      const newProfiles = new Map(state.profiles);
      for (const profile of profiles) {
        if (!profile.platform || !VALID_PLATFORMS.includes(profile.platform)) {
          continue;
        }
        const existingProfiles = state.profiles.get(profile.address) ?? [];
        newProfiles.set(profile.address, [...existingProfiles, profile]);
        if (profile.identity) {
          newNames.set(profile.identity, profile.address);
        }
      }
      set(() => ({
        profiles: newProfiles,
        names: newNames,
      }));
    },
    findProfiles: (addresses: string[]) => {
      const entries = addresses
        .map((address) => [address, get().profiles.get(address)])
        .filter(
          (entry): entry is [string, Profile[]] => entry[1] !== undefined,
        );
      return new Map(entries);
    },
    getProfiles: (address: string) => {
      return get().profiles.get(address) ?? EMPTY_PROFILES;
    },
    hasProfile: (address: string) => {
      return get().profiles.has(address);
    },
    getProfilesByName: (name: string) => {
      const address = get().names.get(name);
      return address ? get().getProfiles(address) : EMPTY_PROFILES;
    },
    reset: () => {
      set(store.getInitialState());
    },
  }),
);

/**
 * Combines multiple profiles into a single profile.
 * Optionally, provide a valid display name to use for the profile.
 *
 * The provided display name must exist in one of the profiles, or it will be
 * ignored.
 *
 * @param address - the address of the profile
 * @param profiles - the profiles to combine
 * @param displayName - optional display name to use for the profile
 * @returns the combined profile
 */
export const combineProfiles = (
  address: string,
  profiles: Profile[],
  identity?: string,
) => {
  const forcedProfile = profiles.find(
    (profile) => profile.identity === identity,
  );
  return profiles.reduce((profile, value) => {
    return {
      ...profile,
      displayName: forcedProfile
        ? forcedProfile.displayName
        : (profile.displayName ?? value.displayName),
      avatar: profile.avatar ?? value.avatar,
      description: profile.description ?? value.description,
      platform: profile.platform ?? value.platform,
      identity: profile.identity ?? value.identity,
    };
  }, createEmptyProfile(address));
};

export const useProfile = (address: string) => {
  const profiles = useStore(
    profilesStore,
    useShallow((state) => state.getProfiles(address)),
  );
  const profile = useMemo(
    () => combineProfiles(address, profiles),
    [address, profiles],
  );
  return profile;
};

export const useAllProfiles = () => {
  return useStore(
    profilesStore,
    useShallow((state) => state.profiles),
  );
};

export const useProfileActions = () => {
  const addProfile = useStore(profilesStore, (state) => state.addProfile);
  const addProfiles = useStore(profilesStore, (state) => state.addProfiles);
  const findProfiles = useStore(profilesStore, (state) => state.findProfiles);
  const getProfiles = useStore(profilesStore, (state) => state.getProfiles);
  const hasProfile = useStore(profilesStore, (state) => state.hasProfile);
  const getProfilesByName = useStore(
    profilesStore,
    (state) => state.getProfilesByName,
  );
  const reset = useStore(profilesStore, (state) => state.reset);
  return {
    addProfile,
    addProfiles,
    findProfiles,
    getProfiles,
    hasProfile,
    getProfilesByName,
    reset,
  };
};
