import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { router } from "./routes";
import { errorHandler, notFound } from "./middlewares/error-handler";
import { adminDemoRouter } from "./routes/admin-demo";
import { adminRouter } from "./routes/admin";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.nodeEnv === "production" ? 1 : false);
app.use(helmet());
// Same-origin requests (frontend and API on one Vercel domain) need no CORS;
// CORS_ORIGINS lists extra origins, e.g. a separately hosted frontend.
app.use(cors({ origin: env.corsOrigins.length ? env.corsOrigins : false }));
app.use(express.json({ limit: "256kb" }));

app.use("/api", router);
app.use("/api/admin-demo", adminDemoRouter);
app.use("/api/admin", adminRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
