import Yacht from "../models/Yacht.js";

export const getYacht = async (req, res) => {
  try {
    const records = await Yacht.find({}).sort({ date: "desc" });

    return res.render("yacht/yacht", {
      pageTitle: "Yacht",
      records,
    });
  } catch (err) {
    console.error(err);
    return res.send("error");
  }
};

// export const getYachtTest = async (req, res) => {
//   try {
//     const records = await Yacht.find({}).sort({ date: "desc" });

//     return res.render("yacht/testui", {
//       pageTitle: "Yacht Test",
//       records,
//     });
//   } catch (err) {
//     console.error(err);
//     return res.send("error");
//   }
// };
