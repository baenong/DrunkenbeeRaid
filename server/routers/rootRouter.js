import express from "express";
import {
  getDeleteComment,
  getWeekParty,
  home,
  resetParties,
  search,
  selectWeekParty,
} from "../controllers/partyController.js";
import { getPatchNote } from "../controllers/patchController.js";

const rootRouter = express.Router();

rootRouter.get("/", home);
rootRouter.get("/search", search);
rootRouter.get("/week", getWeekParty);
rootRouter.get("/week/search", selectWeekParty);
rootRouter.route("/comment/:id([0-9a-f]{24})/delete").get(getDeleteComment);
rootRouter.get("/patch", getPatchNote);

export default rootRouter;
