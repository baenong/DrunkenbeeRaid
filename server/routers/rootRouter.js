import express from "express";
import {
  getDeleteComment,
  getWeekParty,
  home,
  search,
  selectWeekParty,
} from "../controllers/partyController.js";
import { getPatchNote, getTool } from "../controllers/rootController.js";
import { resetParties } from "../middlewares.js";

const rootRouter = express.Router();

rootRouter.get("/", home);
rootRouter.get("/search", search);
rootRouter.get("/week", getWeekParty);
rootRouter.get("/week/search", selectWeekParty);
rootRouter.route("/comment/:id([0-9a-f]{24})/delete").get(getDeleteComment);
rootRouter.get("/patch", getPatchNote);
rootRouter.get("/tool", getTool);
rootRouter.get("/reset", resetParties, home);

export default rootRouter;
