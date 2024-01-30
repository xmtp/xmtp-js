// eslint-disable-next-line
const webCrypto: Crypto =
  // eslint-disable-next-line
  typeof crypto === "undefined" ? require("crypto").webcrypto : crypto;

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const digest = await webCrypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}
