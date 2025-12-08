import { Router } from "express";
import v1Router from "./v1/index.js";
import v2Router from "./v2/index.js";

const apiRouter = Router();

apiRouter.use("/v1", v1Router);
apiRouter.use("/v2", v2Router);

export default apiRouter;
