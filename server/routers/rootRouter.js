import express from "express";
import {
  getDeleteComment,
  getWeekParty,
  home,
  search,
  selectWeekParty,
} from "../controllers/partyController.js";
import { getPatchNote } from "../controllers/patchController.js";
// import { getLogin, logout, postLogin } from "../controllers/userController.js";
// import { protectorMiddleware, publicOnlyMiddleware } from "../middlewares.js";

const rootRouter = express.Router();

rootRouter.get("/", home);
// rootRouter.route("/login").get(getLogin).post(postLogin);
// rootRouter.get("/logout", logout);
//rootRouter.get("/logout", protectorMiddleware, logout);
rootRouter.get("/search", search);
rootRouter.get("/week", getWeekParty);
rootRouter.get("/week/search", selectWeekParty);
rootRouter.route("/comment/:id([0-9a-f]{24})/delete").get(getDeleteComment);
rootRouter.get("/patch", getPatchNote);

export default rootRouter;
