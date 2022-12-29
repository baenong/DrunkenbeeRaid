import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
  parties: [{ type: mongoose.Schema.Types.ObjectId, ref: "Party" }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  memo: { type: String },
});

const User = mongoose.model("User", userSchema);
export default User;
