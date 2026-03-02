import { createServer } from "http";
import { createApp } from "./app";
import { configEnv, env } from "./config/env";

configEnv();

const app = createApp();
const server = createServer(app);

const port = env.PORT || 4000;

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on port ${port}`);
});

