import { describe, expectTypeOf, it } from "vitest";
import { CommandRouter } from "./CommandRouter.js";

describe("CommandRouter", () => {
  describe("types", () => {
    it("types the message content as string in command handlers", () => {
      const router = new CommandRouter();
      router.command("/test", (ctx) => {
        expectTypeOf(ctx.message.content).toEqualTypeOf<string>();
      });
    });
  });
});
