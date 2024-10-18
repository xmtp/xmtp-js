import { crypto } from "@/encryption";
import {
  buildContentTopic,
  buildDirectMessageTopicV2,
  isValidTopic,
} from "@/utils/topic";

describe("topic utils", () => {
  describe("isValidTopic", () => {
    it("validates topics correctly", () => {
      expect(isValidTopic(buildContentTopic("foo"))).toBe(true);
      expect(isValidTopic(buildContentTopic("123"))).toBe(true);
      expect(isValidTopic(buildContentTopic("bar987"))).toBe(true);
      expect(isValidTopic(buildContentTopic("*&+-)"))).toBe(true);
      expect(isValidTopic(buildContentTopic("%#@="))).toBe(true);
      expect(isValidTopic(buildContentTopic('<;.">'))).toBe(true);
      expect(isValidTopic(buildContentTopic(String.fromCharCode(33)))).toBe(
        true,
      );
      expect(isValidTopic(buildContentTopic("∫ß"))).toBe(false);
      expect(isValidTopic(buildContentTopic("\xA9"))).toBe(false);
      expect(isValidTopic(buildContentTopic("\u2665"))).toBe(false);
      expect(isValidTopic(buildContentTopic(String.fromCharCode(1)))).toBe(
        false,
      );
      expect(isValidTopic(buildContentTopic(String.fromCharCode(23)))).toBe(
        false,
      );
    });

    it("validates random topics correctly", () => {
      const topics = Array.from({ length: 100 }).map(() =>
        buildDirectMessageTopicV2(
          Buffer.from(crypto.getRandomValues(new Uint8Array(32)))
            .toString("base64")
            .replace(/=*$/g, "")
            // Replace slashes with dashes so that the topic is still easily split by /
            // We do not treat this as needing to be valid Base64 anywhere
            .replace(/\//g, "-"),
        ),
      );

      topics.forEach((topic) => {
        expect(isValidTopic(topic)).toBe(true);
      });
    });
  });
});
