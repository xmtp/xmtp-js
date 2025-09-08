import express, { type Request, type Response } from "express";
import helmet from "helmet";
import apiRouter from "./api";
import { errorMiddleware } from "./middleware/error";
import { jsonMiddleware } from "./middleware/json";
import { noRouteMiddleware } from "./middleware/noRoute";

const app = express();

// The application may be behind a reverse proxy
// and will need to trust the X-Forwarded-For header to get the client
// IP address
app.set("trust proxy", 1);
app.use(helmet()); // Set security headers
app.use(jsonMiddleware); // Parse JSON requests

// GET /healthcheck - Healthcheck endpoint
app.get("/healthcheck", (_req: Request, res: Response): void => {
  res.status(200).send("OK");
});

// add api routes
app.use("/api", apiRouter);

// handle non-existent routes with 404 response
app.use(noRouteMiddleware);

// Error middleware should be last
app.use(errorMiddleware);

const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
  console.info(`Test API service is running on port ${port}`);
});

process.on("SIGTERM", () => {
  console.info("SIGTERM signal received: closing Test API service");
  server.close(() => {
    console.info("Test API service closed");
  });
});
