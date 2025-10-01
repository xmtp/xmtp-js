import { escape } from "node:querystring";
import { isAddress } from "viem";
import { AgentError } from "@/core/AgentError.js";
import { LimitedMap } from "@/utils/LimitedMap.js";

const cache = new LimitedMap<string, string | null>(1000);

export const isValidName = (name: string): boolean => {
  return /^_?[a-zA-Z0-9-]+(\.base)?\.eth$/.test(name);
};

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
    throw new AgentError(2000, "Could not fetch name");
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

  if (!isValidName(name)) {
    throw new AgentError(
      2001,
      "Invalid name format. Must be a valid ENS (.eth) or Base (.base.eth) name.",
    );
  }

  const response = await fetchFromWeb3Bio(name, apiKey);
  const address = response[0].address;
  cache.set(name, address);
  return address;
};

export const createNameResolver = (apiKey?: string) => {
  return (name: string) => resolveName(name, apiKey);
};
