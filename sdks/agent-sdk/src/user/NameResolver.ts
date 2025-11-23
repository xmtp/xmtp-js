import { escape } from "node:querystring";
import { IdentifierKind, type GroupMember } from "@xmtp/node-sdk";
import { isAddress } from "viem";
import { AgentError } from "@/core/AgentError.js";
import { LimitedMap } from "@/utils/LimitedMap.js";

const cache = new LimitedMap<string, string | null>(1000);

const fetchFromWeb3Bio = async (
  name: string,
  apiKey?: string,
): Promise<{ address: string | null }[]> => {
  const endpoint = `https://api.web3.bio/ns/${escape(name)}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["X-API-KEY"] = `Bearer ${apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new AgentError(
      2000,
      `Could not resolve address for name "${name}": ${response.statusText} (${response.status})`,
    );
  }

  return response.json() as Promise<{ address: string | null }[]>;
};

const resolveName = async (
  name: string,
  apiKey?: string,
): Promise<string | null> => {
  if (isAddress(name)) {
    return name;
  }

  const cachedAddress = cache.get(name);

  if (cachedAddress !== undefined) {
    return cachedAddress;
  }

  const response = await fetchFromWeb3Bio(name, apiKey);
  if (response.length === 0) {
    return null;
  }
  const address = response[0]?.address;
  if (!address) {
    return null;
  }
  cache.set(name, address);
  return address;
};

export const createNameResolver = (apiKey?: string) => {
  return (name: string) => resolveName(name, apiKey);
};

/**
 * Matches a shortened address against a list of full addresses
 * @param shortenedAddress - Shortened address like "0xabc5…f002"
 * @param fullAddresses - Array of full Ethereum addresses to match against
 * @returns Matched full address or null if no match found
 */
export const matchShortenedAddress = (
  shortenedAddress: string,
  fullAddresses: string[],
): string | null => {
  const match = shortenedAddress.match(
    /^(0x[a-fA-F0-9]+)(?:…|\.{2,3})([a-fA-F0-9]+)$/,
  );
  if (!match) return null;

  const [, prefix, suffix] = match;
  if (!prefix || !suffix) return null;

  for (const fullAddress of fullAddresses) {
    const normalized = fullAddress.toLowerCase();
    if (
      normalized.startsWith(prefix.toLowerCase()) &&
      normalized.endsWith(suffix.toLowerCase())
    ) {
      return fullAddress;
    }
  }

  return null;
};

/**
 * Extracts Ethereum addresses from group members
 * @param members - Array of group members
 * @returns Array of Ethereum addresses
 */
export const extractMemberAddresses = (members: GroupMember[]): string[] => {
  const addresses: string[] = [];
  for (const member of members) {
    const ethIdentifier = member.accountIdentifiers.find(
      (id) => id.identifierKind === IdentifierKind.Ethereum,
    );
    if (ethIdentifier) {
      addresses.push(ethIdentifier.identifier);
    }
  }
  return addresses;
};

/**
 * Resolves an identifier to an Ethereum address
 * Handles full addresses, shortened addresses (in groups), and domain names
 * @param identifier - Ethereum address or domain name to resolve
 * @param memberAddresses - Optional array of member addresses to match shortened addresses against
 * @param resolveAddress - Function to resolve domain names to addresses
 * @returns Ethereum address or null if not found
 */
export const resolveIdentifier = async (
  identifier: string,
  memberAddresses?: string[],
  resolveAddress?: (name: string) => Promise<string | null>,
): Promise<string | null> => {
  if (identifier.match(/^0x[a-fA-F0-9]{40}$/)) {
    return identifier;
  }

  if (identifier.match(/0x[a-fA-F0-9]+(?:…|\.{2,3})[a-fA-F0-9]+/)) {
    return memberAddresses?.length
      ? matchShortenedAddress(identifier, memberAddresses)
      : null;
  }

  const nameToResolve = identifier.includes(".")
    ? identifier
    : `${identifier}.farcaster.eth`;

  if (!resolveAddress) return null;

  try {
    return await resolveAddress(nameToResolve);
  } catch {
    return null;
  }
};

/**
 * Extracts mentions/domains from a message
 * Supports formats: @domain.eth, @username, domain.eth, @0xabc...def, @0xabcdef123456
 * @param message - The message text to parse
 * @returns Array of extracted identifiers
 */
export const extractMentions = (message: string): string[] => {
  const mentions: string[] = [];

  const fullAddresses = message.match(/(0x[a-fA-F0-9]{40})\b/g);
  if (fullAddresses) mentions.push(...fullAddresses);

  const shortenedAddresses = message.match(
    /@(0x[a-fA-F0-9]+(?:…|\.{2,3})[a-fA-F0-9]+)/g,
  );
  if (shortenedAddresses) {
    mentions.push(...shortenedAddresses.map((m) => m.slice(1)));
  }

  const atMentions = message.match(/@(?!0x)([\w.-]+\.eth|[\w.-]+)/g);
  if (atMentions) mentions.push(...atMentions.map((m) => m.slice(1)));

  const domains = message.match(/\b(?<!@)([\w-]+(?:\.[\w-]+)*\.eth)\b/g);
  if (domains) mentions.push(...domains);

  const uniqueMentions = [...new Set(mentions)];

  return uniqueMentions.filter((mention) => {
    return !uniqueMentions.some(
      (other) => other !== mention && other.endsWith(`.${mention}`),
    );
  });
};

/**
 * Resolves all mentions in a message to Ethereum addresses
 * @param message - The message text to parse
 * @param members - Optional array of group members to match shortened addresses against
 * @param resolveAddress - Function to resolve domain names to addresses
 * @returns Object mapping identifiers to addresses
 */
export const resolveMentionsInMessage = async (
  message: string,
  members?: GroupMember[],
  resolveAddress?: (name: string) => Promise<string | null>,
): Promise<Record<string, string | null>> => {
  const mentions = extractMentions(message);
  if (mentions.length === 0) return {};

  const memberAddresses = members ? extractMemberAddresses(members) : [];
  const results: Record<string, string | null> = {};

  await Promise.all(
    mentions.map(async (mention) => {
      results[mention] = await resolveIdentifier(
        mention,
        memberAddresses,
        resolveAddress,
      );
    }),
  );

  return results;
};

/**
 * Fetches Farcaster profile information from web3.bio
 * @param name - Name or identifier to look up
 * @param apiKey - Optional API key for web3.bio
 * @returns Profile information including address, display name, platform, username, fid, and social stats
 */
const emptyProfile = {
  address: null,
  displayName: null,
  platform: "",
  username: null,
  fid: null,
  social: null,
};

export const fetchFarcasterProfile = async (
  name: string,
  apiKey?: string,
): Promise<{
  address: string | null | undefined;
  displayName?: string | null;
  platform: string;
  username: string | null | undefined;
  fid: string | null | undefined;
  social?: {
    uid: number | null;
    follower: number | null;
    following: number | null;
  } | null;
}> => {
  try {
    const endpoint = `https://api.web3.bio/profile/${escape(name)}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["X-API-KEY"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return emptyProfile;
    }

    const data = (await response.json()) as Array<{
      address: string | null;
      platform: string;
      displayName?: string;
      username?: string;
      fid?: string;
      social?: {
        uid: number | null;
        follower: number | null;
        following: number | null;
      };
    }> | null;

    const farcasterProfile = data?.find(
      (profile) => profile.platform === "farcaster",
    );

    if (farcasterProfile) {
      return {
        address: farcasterProfile.address,
        displayName: farcasterProfile.displayName,
        platform: farcasterProfile.platform,
        username: farcasterProfile.displayName || null,
        fid: farcasterProfile.social?.uid?.toString() || null,
        social: farcasterProfile.social || null,
      };
    }

    return emptyProfile;
  } catch {
    return emptyProfile;
  }
};
