import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import * as pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Trust the first hop proxy (Replit's ingress). This makes req.ip reflect the
// real client IP from X-Forwarded-For rather than the proxy's IP, which is
// required for correct per-IP rate limiting. Only set to '1' so we only trust
// the closest upstream proxy and ignore any user-injected X-Forwarded-For hops.
app.set("trust proxy", 1);

app.use(
  pinoHttp.pinoHttp({
    logger,
    serializers: {
      req(req: Request) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: Response) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
