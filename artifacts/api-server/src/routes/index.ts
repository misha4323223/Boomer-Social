import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import proxyRouter from "./proxy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(proxyRouter);

export default router;
