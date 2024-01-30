let cachedCrypto: Crypto | undefined;

async function getCrypto(): Promise<Crypto> {
  if (typeof crypto !== "undefined") {
    return crypto;
  }

  if (typeof cachedCrypto !== "undefined") {
    return cachedCrypto;
  }

  if (typeof window !== "undefined" && window.crypto) {
    return window.crypto;
  }

  cachedCrypto = (await import("crypto")).webcrypto as Crypto;

  return cachedCrypto;
}

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const digest = await (await getCrypto()).subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}
