import mongoose from "mongoose";

mongoose.set("strictQuery", false);

mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
const handleOpen = () => console.log("Connected to DB Success!");

db.on("error", (error) => console.log("DB Connection Error!", error));
db.once("open", handleOpen);
