export const getYachtMain = (req, res) => {
  try {
    return res.render("yacht/main");
  } catch (err) {
    console.error(err);
    return res.send("error");
  }
};
