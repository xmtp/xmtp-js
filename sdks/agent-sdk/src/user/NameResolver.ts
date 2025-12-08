import { escape } from "node:querystring";
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
