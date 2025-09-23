import { Router } from "express";
import pinataRouter from "./pinata.router.js";
import resolveRouter from "./resolve.router.js";

const v1Router = Router();

v1Router.use("/pinata", pinataRouter);
v1Router.use("/resolve", resolveRouter);

export default v1Router;
