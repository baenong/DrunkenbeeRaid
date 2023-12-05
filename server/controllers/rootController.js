export const getPatchNote = (req, res) => {
  res.render("patchNote", { pageTitle: "Patch Note" });
};

export const getTool = (req, res) => {
  res.render("tool", { pageTitle: "Tool" });
};
