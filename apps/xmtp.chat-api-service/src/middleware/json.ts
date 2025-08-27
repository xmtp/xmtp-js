import express from "express";

export const jsonMiddleware = express.json({ limit: "50mb" });
