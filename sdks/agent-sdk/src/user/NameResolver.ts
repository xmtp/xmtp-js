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
  // Extract prefix and suffix from shortened address
  const match = shortenedAddress.match(
    /^(0x[a-fA-F0-9]+)(?:…|\.{2,3})([a-fA-F0-9]+)$/,
  );
  if (!match) return null;

  const [, prefix, suffix] = match;
  if (!prefix || !suffix) return null;

  // Find a matching full address
  for (const fullAddress of fullAddresses) {
    const normalizedAddress = fullAddress.toLowerCase();
    if (
      normalizedAddress.startsWith(prefix.toLowerCase()) &&
      normalizedAddress.endsWith(suffix.toLowerCase())
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
  // If it's already a full ethereum address, return it
  if (identifier.match(/^0x[a-fA-F0-9]{40}$/)) {
    return identifier;
  }

  // If it's a shortened address, try to match against member addresses
  if (identifier.match(/0x[a-fA-F0-9]+(?:…|\.{2,3})[a-fA-F0-9]+/)) {
    if (memberAddresses && memberAddresses.length > 0) {
      return matchShortenedAddress(identifier, memberAddresses);
    }
    return null;
  }

  // If it's just a username (no dots), append .farcaster.eth
  let nameToResolve = identifier;
  if (!nameToResolve.includes(".")) {
    nameToResolve = `${nameToResolve}.farcaster.eth`;
  }

  // Otherwise, resolve using provided resolver or return null
  if (resolveAddress) {
    try {
      return await resolveAddress(nameToResolve);
    } catch (error) {
      console.error(`Failed to resolve "${nameToResolve}":`, error);
      return null;
    }
  }

  return null;
};

/**
 * Extracts mentions/domains from a message
 * Supports formats: @domain.eth, @username, domain.eth, @0xabc...def, @0xabcdef123456
 * @param message - The message text to parse
 * @returns Array of extracted identifiers
 */
export const extractMentions = (message: string): string[] => {
  const mentions: string[] = [];

  // Match full Ethereum addresses @0x followed by 40 hex chars (check this FIRST)
  const fullAddresses = message.match(/(0x[a-fA-F0-9]{40})\b/g);
  if (fullAddresses) {
    mentions.push(...fullAddresses); // Remove @
  }

  // Match @0xabc...def (shortened address with ellipsis or dots)
  const shortenedAddresses = message.match(
    /@(0x[a-fA-F0-9]+(?:…|\.{2,3})[a-fA-F0-9]+)/g,
  );
  if (shortenedAddresses) {
    mentions.push(...shortenedAddresses.map((m) => m.slice(1))); // Remove @
  }

  // Match @username.eth or @username (but not if it starts with 0x)
  const atMentions = message.match(/@(?!0x)([\w.-]+\.eth|[\w.-]+)/g);
  if (atMentions) {
    mentions.push(...atMentions.map((m) => m.slice(1))); // Remove @
  }

  // Match standalone domain.eth (not preceded by @ and with word boundaries)
  // Updated to match multi-level domains like byteai.base.eth
  const domains = message.match(/\b(?<!@)([\w-]+(?:\.[\w-]+)*\.eth)\b/g);
  if (domains) {
    mentions.push(...domains);
  }

  // Remove duplicates
  const uniqueMentions = [...new Set(mentions)];

  // Filter out parent domains when subdomains are present
  // e.g., if "byteai.base.eth" exists, remove "base.eth"
  return uniqueMentions.filter((mention) => {
    // Check if this mention is a parent domain of any other mention
    const isParentOfAnother = uniqueMentions.some(
      (other) => other !== mention && other.endsWith(`.${mention}`),
    );
    return !isParentOfAnother;
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
  // Extract mentions from message
  const mentions = extractMentions(message);

  // If no mentions found, return empty object
  if (mentions.length === 0) {
    return {};
  }

  // Extract member addresses if members provided
  const memberAddresses = members ? extractMemberAddresses(members) : [];

  // Resolve all mentions
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
      console.error(
        `Failed to fetch Farcaster profile for "${name}": ${response.statusText} (${response.status})`,
      );
      return {
        address: null,
        displayName: null,
        platform: "",
        username: null,
        fid: null,
        social: null,
      };
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

    // Filter the array to find the Farcaster profile
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

    return {
      address: null,
      displayName: null,
      platform: "",
      username: null,
      fid: null,
      social: null,
    };
  } catch (error) {
    console.error(`Error fetching Farcaster profile for "${name}":`, error);
    return {
      address: null,
      displayName: null,
      platform: "",
      username: null,
      fid: null,
      social: null,
    };
  }
};
