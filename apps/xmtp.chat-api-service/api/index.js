import cors from 'cors';
import express, { Router } from 'express';
import helmet from 'helmet';
import { PinataSDK } from 'pinata';
import { rateLimit } from 'express-rate-limit';

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY,
});
async function getPresignedUrl(req, res) {
    try {
        const url = await pinata.upload.public.createSignedURL({
            expires: 60, // Last for 60 seconds
            groupId: process.env.PINATA_GROUP_ID,
        });
        res.json({ url });
    }
    catch {
        throw new Error("Failed to generate presigned URL");
    }
}
const pinataRouter = Router();
pinataRouter.get("/presigned-url", getPresignedUrl);

const v1Router = Router();
v1Router.use("/pinata", pinataRouter);

const apiRouter = Router();
apiRouter.use("/v1", v1Router);

const errorMiddleware = (err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({
        error: {
            name: err.name,
            message: err.message,
        },
    });
};

const jsonMiddleware = express.json({ limit: "50mb" });

const noRouteMiddleware = (_req, res) => {
    res.status(404).send();
};

// limit API to 300 requests per 5 minutes
const rateLimitMiddleware = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 300,
    legacyHeaders: false,
    standardHeaders: "draft-8",
});

const app = express();
app.use(helmet()); // Set security headers
const getAllowedOrigins = () => {
    return process.env.NODE_ENV === "production"
        ? ["https://xmtp.chat", /^https:\/\/.*ephemerahq\.vercel\.app$/]
        : ["https://xmtp.chat", "http://localhost:5173"];
};
const allowedOrigins = getAllowedOrigins();
// Configure CORS options with stricter security
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) {
            callback(new Error("Origin header is required"));
        }
        else if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            console.error(`CORS blocked request from unauthorized origin: ${origin}`);
            callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    maxAge: 86400,
};
app.use(cors(process.env.NODE_ENV === "production" ? corsOptions : {})); // Handle CORS
app.use(jsonMiddleware); // Parse JSON requests
// Rate limiting should be before routes but after logging
app.use(rateLimitMiddleware);
// GET /healthcheck - Healthcheck endpoint
app.get("/healthcheck", (_req, res) => {
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

export { app as default };
