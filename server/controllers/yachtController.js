import Yacht from "../models/Yacht.js";

export const getYachtMain = async (req, res) => {
  try {
    const records = await Yacht.find({}).sort({ date: "desc" });

    return res.render("yacht/main", {
      pageTitle: "Yacht",
      records,
    });
  } catch (err) {
    console.error(err);
    return res.send("error");
  }
};
