import express from "express";
import {
  getCreateUser,
  getUserList,
  postCreateUser,
  getUserInfo,
  getEditUser,
  postEditUser,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/", getUserList);
userRouter.route("/create").get(getCreateUser).post(postCreateUser);
userRouter.get("/:id([0-9a-f]{24})", getUserInfo);
userRouter.route("/:id([0-9a-f]{24})/edit").get(getEditUser).post(postEditUser);

export default userRouter;
