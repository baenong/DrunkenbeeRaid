import express from "express";
import {
  deleteChar,
  getCharInfo,
  getCharList,
  getCreateChar,
  getEditChar,
  postCreateChar,
} from "../controllers/charController.js";

const charRouter = express.Router();

charRouter.get("/", getCharList);
charRouter.route("/create").get(getCreateChar).post(postCreateChar);
charRouter.route("/:id([0-9a-f]{24})").get(getCharInfo);
charRouter
  .route("/:id([0-9a-f]{24})/edit")
  .get(getEditChar)
  .post(postCreateChar);
charRouter.get("/:id([0-9a-f]{24})/delete", deleteChar);

export default charRouter;
