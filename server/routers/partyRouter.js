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
import { protectorMiddleware } from "../middlewares.js";

const partyRouter = express.Router();

partyRouter.get("/", home);
partyRouter.get("/search", search);
partyRouter.get("/:id([0-9a-f]{24})", showPartyInfo);
partyRouter
  .route("/:id([0-9a-f]{24})/edit")
  .all(protectorMiddleware)
  .get(getEditParty)
  .post(postEditParty);
partyRouter.get("/:id([0-9a-f]{24})/delete", protectorMiddleware, deleteParty);
partyRouter
  .route("/create")
  .all(protectorMiddleware)
  .get(getCreateParty)
  .post(postCreateParty);
partyRouter
  .route("/:id([0-9a-f]{24})/comment")
  .all(protectorMiddleware)
  .post(postEditComment);

export default partyRouter;
