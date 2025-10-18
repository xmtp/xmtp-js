import { Router } from "express";
import resolveRouter from "./resolve.router.js";

const v2Router = Router();

v2Router.use("/resolve", resolveRouter);

export default v2Router;
