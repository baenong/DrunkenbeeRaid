import express from "express";
import { getYacht } from "../controllers/yachtController";

const yachtRouter = express.Router();

// yachtRouter.get("/", getYachtMain);
yachtRouter.get("/", getYacht);

export default yachtRouter;
