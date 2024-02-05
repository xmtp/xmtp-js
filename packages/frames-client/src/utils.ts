import { fetcher } from "@xmtp/proto";
import { sha256 } from "@noble/hashes/sha256";
import type { FrameActionInputs } from "./types";
import { InvalidArgumentsError } from "./errors";

const { b64Encode } = fetcher;

export function concatArrays(...arrays: Uint8Array[]): Uint8Array {
  return new Uint8Array(
    arrays.reduce((acc, arr) => acc.concat(Array.from(arr)), [] as number[]),
  );
}

export function concatStringsToBytes(...arrays: string[]): Uint8Array {
  return new TextEncoder().encode(arrays.join(""));
}

export function base64Encode(input: Uint8Array): string {
  return b64Encode(input, 0, input.length);
}

export function buildOpaqueIdentifier(inputs: FrameActionInputs): string {
  if ("groupId" in inputs && "groupSecret" in inputs) {
    return base64Encode(
      sha256(concatArrays(inputs.groupId, inputs.groupSecret)),
    );
  }

  const { conversationTopic, participantAccountAddresses } = inputs;
  if (!conversationTopic || !participantAccountAddresses.length) {
    throw new InvalidArgumentsError(
      "Missing conversation topic or participants",
    );
  }

  return base64Encode(
    sha256(
      concatStringsToBytes(
        conversationTopic.toLowerCase(),
        ...participantAccountAddresses.map((p) => p.toLowerCase()).sort(),
      ),
    ),
  );
}
