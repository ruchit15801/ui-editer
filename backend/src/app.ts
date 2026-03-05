import express, { Application } from "express";
import cors from "cors";
import path from "path";
import { configEnv } from "./config/env";
import { imageRouter } from "./routes/image.routes";
import { errorHandler } from "./middleware/error.middleware";

configEnv();

export const createApp = (): Application => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", imageRouter);

  app.use("/public", express.static(path.join(__dirname, "..", "public")));

  app.use(errorHandler);

  return app;
};

