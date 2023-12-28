import mongoose from "mongoose";
import { logger } from "./log";

mongoose.set("strictQuery", false);

mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
const handleOpen = () =>
  logger.info(`[${new Date()}] Connected to DB Success!`);

db.on("error", (error) =>
  logger.error(`[${new Date()}]DB Connection Error! ${error}`)
);
db.once("open", handleOpen);
