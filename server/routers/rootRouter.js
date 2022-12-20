import express from "express";
import {
  getDeleteComment,
  getWeekParty,
  home,
  search,
  selectWeekParty,
} from "../controllers/partyController.js";

const rootRouter = express.Router();

rootRouter.get("/", home);
rootRouter.get("/search", search);
rootRouter.get("/week", getWeekParty);
rootRouter.get("/week/search", selectWeekParty);
rootRouter.get("/comment/:id([0-9a-f]{24})/delete", getDeleteComment);

export default rootRouter;
