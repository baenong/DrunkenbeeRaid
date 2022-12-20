import express from "express";
import {
  getCreateUser,
  getUserList,
  postCreateUser,
  getUserInfo,
  getEditUser,
  postEditUser,
} from "../controllers/userController.js";

const rootRouter = express.Router();

rootRouter.get("/", getUserList);
rootRouter.route("/create").get(getCreateUser).post(postCreateUser);
rootRouter.get("/:id([0-9a-f]{24})", getUserInfo);
rootRouter.route("/:id([0-9a-f]{24})/edit").get(getEditUser).post(postEditUser);

export default rootRouter;
