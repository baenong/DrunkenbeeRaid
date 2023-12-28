import express from "express";
import morgan from "morgan";
import { logger } from "./log";
import cors from "cors";
import session from "express-session";
import expressFlash from "express-flash";
import MongoStore from "connect-mongo";
import http from "http";

import rootRouter from "./routers/rootRouter.js";
import partyRouter from "./routers/partyRouter.js";
import userRouter from "./routers/userRouter.js";
import charRouter from "./routers/charRouter.js";
import resetCron from "./cron.js";
import yachtRouter from "./routers/yachtRouter.js";

const app = express();
app.use(cors());

app.set("view engine", "pug");
app.set("views", process.cwd() + "/server/views");

app.use(morgan("combined", { stream: logger.stream }));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.DB_URL }),
  })
);

app.use(expressFlash());

app.use("/static", express.static("assets"));
app.use("/", rootRouter);
app.use("/party", partyRouter);
app.use("/user", userRouter);
app.use("/character", charRouter);
app.use("/yacht", yachtRouter);

resetCron.start();
logger.info(`[${new Date()}] Cron Start`);

const httpServer = http.createServer(app);

export default httpServer;
