import { useMemo } from "react";
import { createStore, useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";

export type Platform = "unknown" | "ens" | "basenames";

export type Profile = {
  address: string;
  avatar: string | null;
  description: string | null;
  displayName: string | null;
  platform: Platform | null;
};

export const createEmptyProfile = (address: string): Profile => ({
  address,
  avatar: null,
  description: null,
  displayName: null,
  platform: null,
});

export type ProfilesState = {
  profiles: Map<string, Profile[]>;
};

export type ProfilesActions = {
  addProfile: (profile: Profile) => void;
  addProfiles: (profiles: Profile[]) => void;
  findProfiles: (addresses: string[]) => Map<string, Profile[]>;
  getProfiles: (address: string) => Profile[];
  hasProfile: (address: string) => boolean;
  reset: () => void;
};

export const profilesStore = createStore<ProfilesState & ProfilesActions>()(
  (set, get, store) => ({
    profiles: new Map(),
    addProfile: (profile: Profile) => {
      set((state) => ({
        profiles: new Map(state.profiles).set(profile.address, [
          ...(state.profiles.get(profile.address) ?? []),
          profile,
        ]),
      }));
    },
    addProfiles: (profiles: Profile[]) => {
      set((state) => {
        const newProfiles = new Map(state.profiles);
        profiles.forEach((profile) => {
          const existingProfiles = newProfiles.get(profile.address) ?? [];
          newProfiles.set(profile.address, [...existingProfiles, profile]);
        });
        return {
          profiles: newProfiles,
        };
      });
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
      return get().profiles.get(address) ?? [];
    },
    hasProfile: (address: string) => {
      return get().profiles.has(address);
    },
    reset: () => {
      set(store.getInitialState());
    },
  }),
);

export const combineProfiles = (address: string, profiles: Profile[]) => {
  return profiles.reduce((profile, value) => {
    return {
      ...profile,
      displayName: profile.displayName ?? value.displayName,
      avatar: profile.avatar ?? value.avatar,
      description: profile.description ?? value.description,
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
  const reset = useStore(profilesStore, (state) => state.reset);
  return {
    addProfile,
    addProfiles,
    findProfiles,
    getProfiles,
    hasProfile,
    reset,
  };
};
