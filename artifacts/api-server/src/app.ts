import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
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

// Global error handler so we get JSON instead of HTML
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err);
  
  // Try to extract the root cause if it's a Drizzle error wrapping a Postgres error
  let rootCause = err.message;
  let code = undefined;
  if (err.cause) {
    rootCause = err.cause.message || err.cause;
    code = err.cause.code;
  }
  
  res.status(500).json({ 
    error: "Internal Server Error", 
    details: rootCause, 
    code: code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
  });
});

export default app;
