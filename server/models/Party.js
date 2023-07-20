import mongoose from "mongoose";

const partySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 50 },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
  weekday: { type: String, reauired: true, default: 0 },
  startAt: { type: String, required: true, default: "20:00" },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  hashtags: [{ type: String, trim: true }],
  employ: { type: Boolean, default: false },
  fixed: { type: Boolean, default: false },
});

partySchema.static("formatHashtags", (hashtags) => {
  return hashtags
    .split(",")
    .map((word) => (word.startsWith("#") ? word : `#${word}`));
});

const Party = mongoose.model("Party", partySchema);
export default Party;
