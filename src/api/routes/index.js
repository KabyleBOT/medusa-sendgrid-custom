// path : src\api\routes\index.js

import { Router } from "express";
import bodyParser from "body-parser";
import middlewares from "../middleware";
import { getConfigFile } from "medusa-core-utils";
import cors from "cors";

const route = Router();

export default (app) => {
  app.use("/sendgrid", route);

  const rootDirectory = process.cwd();

  const { configModule } = getConfigFile(
    rootDirectory,
    "medusa-config"
  );

  const { projectConfig } = configModule;

  const storeCorsOptions = {
    origin: projectConfig.store_cors.split(","),
    credentials: true,
  };

  route.use(cors(storeCorsOptions));

  route.post(
    "/send",
    bodyParser.raw({ type: "application/json" }),
    middlewares.wrap(require("./send-email").default)
  );

  route.post(
    "/send-email-code",
    bodyParser.raw({ type: "application/json" }),
    middlewares.wrap(require("./send-email-code").default)
  );

  route.post(
    "/verify-email-code",
    bodyParser.raw({ type: "application/json" }),
    middlewares.wrap(require("./verify-email-code").default)
  );

  return app;
};
