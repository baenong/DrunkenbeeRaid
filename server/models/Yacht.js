import mongoose from "mongoose";

const yachtSchema = new mongoose.Schema({
  player1: { type: String, required: true },
  player2: { type: String, required: true },
  scores1: [{ type: Number, default: 0 }],
  scores2: [{ type: Number, default: 0 }],
  winner: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const Yacht = mongoose.model("Yacht", yachtSchema);
export default Yacht;
