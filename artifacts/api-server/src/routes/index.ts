import { Router, type IRouter } from "express";
import healthRouter from "./health";
import iplRouter from "./ipl";
import iplPointsRouter from "./ipl-points";
import pushRouter from "./push";

const router: IRouter = Router();

router.use(healthRouter);
router.use(iplRouter);
router.use(iplPointsRouter);
router.use(pushRouter);

export default router;
