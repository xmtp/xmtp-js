import type { Platform, Profile } from "@prisma/client";
import { addDays, isAfter } from "date-fns";
import { Router, type Request, type Response } from "express";
import { Platform as Web3BioPlatform } from "web3bio-profile-kit/types";
import { z } from "zod";
import { prisma } from "../../helpers/prisma.js";
import { batchFetchProfiles, fetchAddress } from "../../helpers/web3.bio.js";

export const resolvePlatform = (platform: Web3BioPlatform): Platform => {
  switch (platform) {
    case Web3BioPlatform.ens:
      return "ens";
    case Web3BioPlatform.basenames:
      return "basenames";
    case Web3BioPlatform.farcaster:
      return "farcaster";
    default:
      return "unknown";
  }
};

type ReducedProfile = Omit<Profile, "id" | "createdAt" | "updatedAt">;
type CombinedProfiles = Record<string, ReducedProfile[]>;

export const combineProfiles = (
  profiles: ReducedProfile[],
): CombinedProfiles => {
  return profiles.reduce<CombinedProfiles>((result, profile) => {
    (result[profile.address] ??= []).push(profile);
    return result;
  }, {});
};

export const resolveAddressSchema = z.object({
  addresses: z.string().length(42).startsWith("0x").array(),
});

export async function resolveAddresses(req: Request, res: Response) {
  try {
    const { addresses } = resolveAddressSchema.parse(req.body);

    const cachedProfiles = await prisma.profile.findMany({
      where: {
        address: {
          in: addresses,
        },
      },
    });

    // addresses not found in the database
    const profileAddresses = cachedProfiles.map((p) => p.address);
    const missingAddresses = addresses.filter(
      (address) => !profileAddresses.includes(address),
    );

    // profiles that have not been updated in the last 7 days
    const expired = cachedProfiles.filter((profile) =>
      isAfter(new Date(), addDays(profile.updatedAt, 7)),
    );
    const expiredProfileAddresses = expired.map((p) => p.address);

    const addressesToResolve = [
      ...missingAddresses,
      ...expired.map((p) => p.address),
    ];

    const fetchedProfiles = await batchFetchProfiles(addressesToResolve);

    // insert new profiles into the database
    const newProfiles = fetchedProfiles.filter(
      (p) => p.address && missingAddresses.includes(p.address),
    );
    const createdProfiles = await prisma.profile.createManyAndReturn({
      data: newProfiles.map((p) => ({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        address: p.address!,
        identity: p.identity,
        platform: resolvePlatform(p.platform),
        displayName: p.displayName,
        email: p.email,
        location: p.location,
        status: p.status,
        avatar: p.avatar,
        description: p.description,
      })),
      omit: {
        id: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // update expired profiles in the database
    const expiredProfiles = fetchedProfiles.filter(
      (p) => p.address && expiredProfileAddresses.includes(p.address),
    );
    const updatedProfiles = await prisma.profile.updateManyAndReturn({
      data: expiredProfiles.map((p) => ({
        address: p.address,
        identity: p.identity,
        platform: resolvePlatform(p.platform),
        displayName: p.displayName,
        email: p.email,
        location: p.location,
        status: p.status,
        avatar: p.avatar,
        description: p.description,
      })),
      omit: {
        id: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // return the profiles
    res.json({
      profiles: combineProfiles([...createdProfiles, ...updatedProfiles]),
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error(z.prettifyError(error));
      res.status(400).json({
        error: "Invalid request body",
        details: z.treeifyError(error),
      });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Failed to resolve addresses" });
  }
}

export const resolveNameSchema = z
  .string()
  .endsWith(".eth")
  .or(z.string().endsWith(".base.eth"));

export async function resolveName(req: Request, res: Response) {
  try {
    const { name } = req.params;
    const validName = resolveNameSchema.parse(name);
    const address = await fetchAddress(validName);
    res.json({ address });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.log("zod error", z.prettifyError(error));
      res.status(400).json({
        error: "Invalid request body",
        details: z.treeifyError(error),
      });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Failed to resolve name" });
  }
}

const resolveRouter = Router();
resolveRouter.get("/name/:name", resolveName);

// resolveRouter.post("/addresses", resolveAddresses);

export default resolveRouter;
