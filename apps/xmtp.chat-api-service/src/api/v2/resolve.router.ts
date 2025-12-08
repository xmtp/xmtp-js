import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { fetchProfilesFromName } from "../../helpers/web3.bio.js";

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
    res.json({ profiles });
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

export default resolveRouter;
