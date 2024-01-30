async function getCrypto(): Promise<Crypto> {
  if (typeof crypto !== "undefined") {
    return crypto;
  }

  if (typeof window !== "undefined" && window.crypto) {
    return window.crypto;
  }

  return (await import("crypto")).webcrypto as Crypto;
}

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const digest = await (await getCrypto()).subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}
