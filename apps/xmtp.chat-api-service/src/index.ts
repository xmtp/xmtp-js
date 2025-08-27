import cors from "cors";
import express, { type Request, type Response } from "express";
import helmet from "helmet";
import apiRouter from "./api";
import { errorMiddleware } from "./middleware/error";
import { jsonMiddleware } from "./middleware/json";
import { noRouteMiddleware } from "./middleware/noRoute";
import { rateLimitMiddleware } from "./middleware/rateLimit";

const app = express();

app.use(helmet()); // Set security headers
app.use(cors()); // Handle CORS
app.use(jsonMiddleware); // Parse JSON requests

// Rate limiting should be before routes but after logging
app.use(rateLimitMiddleware);

// GET /healthcheck - Healthcheck endpoint
app.get("/healthcheck", (_req: Request, res: Response): void => {
  res.status(200).send("OK");
});

// add api routes
app.use("/api", apiRouter);

// handle non-existent routes with 404 response
app.use(noRouteMiddleware);

// Error handling middleware should be last
app.use(errorMiddleware);

const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
  console.log(`xmtp.chat API service is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing xmtp.chat API service");
  server.close(() => {
    console.log("xmtp.chat API service closed");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing xmtp.chat API service");
  server.close(() => {
    console.log("xmtp.chat API service closed");
  });
});

export default app;
