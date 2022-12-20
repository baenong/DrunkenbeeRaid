import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  createdAt: { type: Date, required: true, default: Date.now },
  text: { type: String, required: true },
  party: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Party" },
});

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
