import express from "express";
import {
  deleteParty,
  getEditParty,
  getCreateParty,
  home,
  postCreateParty,
  search,
  showPartyInfo,
  postEditParty,
  postEditComment,
} from "../controllers/partyController.js";
// import { protectorMiddleware } from "../middlewares.js";

const partyRouter = express.Router();

partyRouter.get("/", home);
partyRouter.get("/search", search);
partyRouter.get("/:id([0-9a-f]{24})", showPartyInfo);
partyRouter
  .route("/:id([0-9a-f]{24})/edit")
  .get(getEditParty)
  .post(postEditParty);
partyRouter.get("/:id([0-9a-f]{24})/delete", deleteParty);
//partyRouter.get("/:id([0-9a-f]{24})/delete", protectorMiddleware, deleteParty);
partyRouter.route("/create").get(getCreateParty).post(postCreateParty);
partyRouter.route("/:id([0-9a-f]{24})/comment").post(postEditComment);

export default partyRouter;
