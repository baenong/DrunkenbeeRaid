import express from "express";
import {
  getCharInfo,
  getCharList,
  getCreateChar,
  getEditChar,
  postCreateChar,
} from "../controllers/charController.js";
import { protectorMiddleware } from "../middlewares.js";

const charRouter = express.Router();

charRouter.get("/", getCharList);
charRouter
  .route("/create")
  .all(protectorMiddleware)
  .get(getCreateChar)
  .post(postCreateChar);
charRouter.route("/:id([0-9a-f]{24})").get(getCharInfo);
charRouter
  .route("/:id([0-9a-f]{24})/edit")
  .all(protectorMiddleware)
  .get(getEditChar)
  .post(postCreateChar);

export default charRouter;
