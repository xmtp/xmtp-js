import { describe, expect, it } from "vitest";
import { batchFetchProfiles, fetchAddress } from "@/helpers/web3.bio";

describe("web3bio", () => {
  it("should fetch a batch of profiles", async () => {
    const profiles = await batchFetchProfiles([
      "0xfab1487b2fdf8606fa71377768d07abfbdb9847d",
    ]);
    expect(profiles).toBeDefined();
    console.log(profiles);
  });

  it("should fetch an address", async () => {
    const address = await fetchAddress("rygine.eth");
    expect(address).toBeDefined();
    console.log(address);
  });
});
