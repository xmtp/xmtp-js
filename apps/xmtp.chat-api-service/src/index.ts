import cors, { type CorsOptions } from "cors";
import express, { type Request, type Response } from "express";
import helmet from "helmet";
import apiRouter from "./api";
import { errorMiddleware } from "./middleware/error";
import { jsonMiddleware } from "./middleware/json";
import { noRouteMiddleware } from "./middleware/noRoute";
import { rateLimitMiddleware } from "./middleware/rateLimit";

const app = express();

app.use(helmet()); // Set security headers

const getAllowedOrigins = (): string[] => {
  return process.env.NODE_ENV === "production"
    ? ["https://xmtp.chat"]
    : ["https://xmtp.chat", "http://localhost:5173"];
};

const allowedOrigins = getAllowedOrigins();

// Configure CORS options with stricter security
const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      callback(new Error("Origin header is required"));
    } else if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS blocked request from unauthorized origin: ${origin}`);
      callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  maxAge: 86400,
};

app.use(cors(corsOptions)); // Handle CORS
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
  console.log(`CORS enabled for origins: ${allowedOrigins.join(", ")}`);
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
