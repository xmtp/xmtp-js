import type { Request, Response } from "express";

export const noRouteMiddleware = (req: Request, res: Response): void => {
  console.log(`[404] No route found for ${req.method} ${req.path}`);
  res.status(404).send();
};
