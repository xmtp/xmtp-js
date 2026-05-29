import { describe, expect, it } from "vitest";
import { isGetInboxIdsRequestError } from "./errors";

describe("isGetInboxIdsRequestError", () => {
  it("detects get_inbox_ids request errors", () => {
    expect(
      isGetInboxIdsRequestError(
        new Error(
          'api client error api client at endpoint "get_inbox_ids" has error error sending request',
        ),
      ),
    ).toBe(true);
  });

  it("ignores other errors", () => {
    expect(isGetInboxIdsRequestError(new Error("Wrong chain id"))).toBe(false);
    expect(isGetInboxIdsRequestError("get_inbox_ids")).toBe(false);
  });
});
