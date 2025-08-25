import { Router, type Request, type Response } from "express";
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY,
});

export async function getPresignedUrl(req: Request, res: Response) {
  try {
    const url = await pinata.upload.public.createSignedURL({
      expires: 60, // Last for 60 seconds
      groupId: process.env.PINATA_GROUP_ID,
    });

    res.json({ url });
  } catch (err) {
    console.error("Error fetching current user:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

const pinataRouter = Router();

pinataRouter.get("/presigned-url", getPresignedUrl);

export default pinataRouter;
