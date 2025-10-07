import type { Platform, Profile } from "@prisma/client";
import { addDays, isAfter } from "date-fns";
import { Router, type Request, type Response } from "express";
import {
  Platform as Web3BioPlatform,
  type ProfileResponse,
} from "web3bio-profile-kit/types";
import { z } from "zod";
import { prisma } from "../../helpers/prisma.js";
import {
  batchFetchNames,
  fetchProfilesFromName,
} from "../../helpers/web3.bio.js";

const hasIdentity = (identity: string, profiles: Profile[]) => {
  const [platform, address] = identity.split(",");
  return profiles.some((p) => p.platform === platform && p.address === address);
};

export const resolvePlatform = (platform: Web3BioPlatform): Platform => {
  switch (platform) {
    case Web3BioPlatform.ens:
      return "ens";
    case Web3BioPlatform.basenames:
      return "basenames";
    default:
      return "unknown";
  }
};

type ProfileResponseWithAddress = ProfileResponse & {
  address: string;
};

export const resolveAddressSchema = z.object({
  addresses: z.string().length(42).startsWith("0x").array().min(1),
});

export async function resolveProfiles(req: Request, res: Response) {
  try {
    const { addresses } = resolveAddressSchema.parse(req.body);
    const identities = addresses.reduce<string[]>((result, address) => {
      return [...result, `ens,${address}`, `basenames,${address}`];
    }, []);

    const cachedProfiles = await prisma.profile.findMany({
      where: {
        address: {
          in: addresses,
        },
      },
    });

    // identities not found in the database
    const missingIdentities = identities.filter(
      (identity) => !hasIdentity(identity, cachedProfiles),
    );

    // profiles that have been updated within the last 7 days
    const validProfiles = cachedProfiles.filter(
      (profile) => !isAfter(new Date(), addDays(profile.updatedAt, 7)),
    );

    // profiles that have not been updated in the last 7 days
    const expired = cachedProfiles.filter((profile) =>
      isAfter(new Date(), addDays(profile.updatedAt, 7)),
    );
    const expiredProfileIdentities = expired.map(
      (p) => `${p.platform},${p.address}`,
    );

    const addressesToResolve = [
      ...missingIdentities,
      ...expiredProfileIdentities,
    ];

    const fetchedProfiles = await batchFetchNames(addressesToResolve);

    // insert new profiles into the database
    const newProfiles = fetchedProfiles.filter(
      (p) =>
        p.address && missingIdentities.includes(`${p.platform},${p.address}`),
    ) as ProfileResponseWithAddress[];
    if (newProfiles.length > 0) {
      const createdProfiles = await prisma.profile.createManyAndReturn({
        data: newProfiles.map((p) => ({
          address: p.address,
          avatar: p.avatar,
          description: p.description,
          displayName: p.displayName,
          identity: p.identity,
          platform: resolvePlatform(p.platform),
        })),
      });
      validProfiles.push(...createdProfiles);
    }

    // update expired profiles in the database
    const expiredProfiles = fetchedProfiles.filter(
      (p) =>
        p.address &&
        expiredProfileIdentities.includes(`${p.platform},${p.address}`),
    );

    if (expiredProfiles.length > 0) {
      for (const p of expiredProfiles) {
        const expiredProfile = expired.find(
          (e) => e.address === p.address && e.platform === p.platform,
        );
        if (!expiredProfile || !p.address) {
          continue;
        }
        const updatedProfile = await prisma.profile.update({
          where: { id: expiredProfile.id },
          data: {
            address: p.address,
            avatar: p.avatar,
            description: p.description,
            displayName: p.displayName,
            platform: resolvePlatform(p.platform),
          },
        });
        validProfiles.push(updatedProfile);
      }
    }

    // return the profiles
    res.json({
      profiles: validProfiles.map((p) => ({
        address: p.address,
        avatar: p.avatar,
        description: p.description,
        displayName: p.displayName,
        identity: p.identity,
        platform: p.platform,
      })),
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

export const resolveNameSchema = z.string().endsWith(".eth");

export async function resolveName(req: Request, res: Response) {
  try {
    const { name } = req.params;
    const validName = resolveNameSchema.parse(name);
    const profiles = await fetchProfilesFromName(validName);
    if (!profiles || profiles.length === 0) {
      res.status(404).json({ error: "No profiles found" });
      return;
    }
    res.json({ address: profiles[0].address });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.log("zod error", z.prettifyError(error));
      res.status(400).json({
        error: "Invalid request parameter",
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
resolveRouter.post("/profiles", resolveProfiles);

export default resolveRouter;
