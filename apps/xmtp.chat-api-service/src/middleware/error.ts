import type { NextFunction, Request, Response } from "express";

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error(err);
  res.status(500).json({
    error: {
      name: err.name,
      message: err.message,
    },
  });
};
