import express from "express";
import { getYachtMain } from "../controllers/yachtController";

const yachtRouter = express.Router();

yachtRouter.get("/", getYachtMain);

export default yachtRouter;
