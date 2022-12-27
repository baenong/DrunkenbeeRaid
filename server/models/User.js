import mongoose from "mongoose";
// import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  characters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Character" }],
  parties: [{ type: mongoose.Schema.Types.ObjectId, ref: "Party" }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  // password: {type: String}
});

// userSchema.pre("save", async function () {
//   if (this.isModified("password")) {
//     try {
//       this.password = await bcrypt.hash(this.password, 5);
//     } catch (error) {
//       console.log(error);
//     }
//   }
// });

const User = mongoose.model("User", userSchema);
export default User;
