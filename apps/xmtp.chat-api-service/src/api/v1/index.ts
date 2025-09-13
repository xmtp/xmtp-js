import { Router } from "express";
import pinataRouter from "./pinata.router.js";

const v1Router = Router();

v1Router.use("/pinata", pinataRouter);

export default v1Router;
