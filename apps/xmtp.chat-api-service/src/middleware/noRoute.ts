import type { Request, Response } from "express";

export const noRouteMiddleware = (_req: Request, res: Response): void => {
  res.status(404).send();
};
