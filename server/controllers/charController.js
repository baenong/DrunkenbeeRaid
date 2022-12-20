import Character from "../models/Character.js";

export const getCharList = async (req, res) => {
  try {
    const chars = await Character.find({});
    return res.render("charList", { pageTitle: "Char", chars });
  } catch {
    req.flash("error", "에러 발생");
    return res.send("error");
  }
};

export const getCreateChar = (req, res) => {
  res.render("createChar", { pageTitle: "Create Char" });
};

export const postCreateChar = async (req, res) => {
  const {
    body: { name, classname },
  } = req;
  if (name === "" || name === undefined) {
    req.flash("error", "캐릭터명을 입력하세요!");
    return res.status(404).redirect("/");
  }
  // 캐릭터 이름 기준으로 검증
  const isExists = await Character.findOne({ name: name });
  if (!isExists) {
    // 신규 생성
    await Character.create({
      name,
      classname,
    });
    req.flash("success", `${name}이(가) 생성됨`);
  } else {
    // Update!
    req.flash("info", `${name}이(가) 변경됨`);
    await Character.findByIdAndUpdate(isExists._id, {
      name,
      classname,
    });
  }
  res.redirect("/");
};

export const getCharInfo = async (req, res) => {
  const {
    params: { id },
  } = req;

  const char = await Character.findById(id)
    .populate("owner", ["name"])
    .populate("parties", [
      "title",
      "members",
      "weekday",
      "startAt",
      "hashtags",
    ]);
  console.log(char);
  res.render("charInfo", { pageTitle: "Char Info", char });
};

export const getEditChar = async (req, res) => {
  const {
    params: { id },
  } = req;
  const char = await Character.findById(id);
  res.render("createChar", { pageTitle: "Edit Char", char });
};
