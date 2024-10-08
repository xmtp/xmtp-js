import { Buffer } from "buffer";
import { webcrypto } from "crypto";

globalThis.Buffer = Buffer;
globalThis.crypto = webcrypto as unknown as Crypto;
