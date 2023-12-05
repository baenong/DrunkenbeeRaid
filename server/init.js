import "dotenv/config";
import "regenerator-runtime";

import "./db";
import "./models/Character";
import "./models/Party";
import "./models/User";
import "./models/Comment";
import httpServer from "./server";
import "./yachtServer";

import { logger } from "./log";

const PORT = process.env.PORT || 4000;

const handleListening = () => {
  logger.info(`Server listening on port http://localhost:${PORT}`);
};

httpServer.listen(PORT, handleListening);
