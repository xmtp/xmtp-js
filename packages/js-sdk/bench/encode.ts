import { add } from "benny";
import Client from "@/Client";
import { ConversationV2 } from "@/conversations/Conversation";
import { SignedPublicKeyBundle } from "@/crypto/PublicKeyBundle";
import { MessageV1 } from "@/Message";
import { dateToNs } from "@/utils/date";
import { newLocalHostClient, newWallet } from "@test/helpers";
import {
  MESSAGE_SIZES,
  newPrivateKeyBundle,
  randomBytes,
  wrapSuite,
} from "./helpers";

const encodeV1 = () => {
  return MESSAGE_SIZES.map((size) =>
    add(`encode and encrypt a ${size} byte v1 message`, async () => {
      const alice = await Client.create(newWallet(), { env: "local" });
      const bobKeys = (await newPrivateKeyBundle()).getPublicKeyBundle();

      const message = randomBytes(size).toString();
      const timestamp = new Date();

      // The returned function is the actual benchmark. Everything above is setup
      return async () => {
        const { payload: encodedMessage } = await alice.encodeContent(message);
        await MessageV1.encode(
          alice.keystore,
          encodedMessage,
          alice.publicKeyBundle,
          bobKeys,
          timestamp,
        );
      };
    }),
  );
};

const encodeV2 = () => {
  // All these sizes should take roughly the same amount of time
  return MESSAGE_SIZES.map((size) =>
    add(`encode and encrypt a ${size} byte v2 message`, async () => {
      const alice = await newLocalHostClient();
      const bob = await newPrivateKeyBundle();

      const invite = await alice.keystore.createInvite({
        recipient: SignedPublicKeyBundle.fromLegacyBundle(
          bob.getPublicKeyBundle(),
        ),
        createdNs: dateToNs(new Date()),
        context: undefined,
        consentProof: undefined,
      });
      const convo = new ConversationV2(
        alice,
        invite.conversation?.topic ?? "",
        bob.identityKey.publicKey.walletSignatureAddress(),
        new Date(),
        undefined,
        undefined,
      );
      const message = randomBytes(size);
      const { payload, shouldPush } = await alice.encodeContent(message);

      // The returned function is the actual benchmark. Everything above is setup
      return async () => {
        await convo.createMessage(payload, shouldPush);
      };
    }),
  );
};

export default wrapSuite("encode", ...encodeV1(), ...encodeV2());
