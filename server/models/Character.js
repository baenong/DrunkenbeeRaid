import mongoose from "mongoose";

const characterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  classname: { type: String, required: true },
  parties: [{ type: mongoose.Schema.Types.ObjectId, ref: "Party" }],
});

const Character = mongoose.model("Character", characterSchema);
export default Character;
