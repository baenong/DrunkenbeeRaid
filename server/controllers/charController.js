import Character from "../models/Character.js";

export const getCharList = async (req, res) => {
  try {
    const chars = await Character.find({});
    return res.render("char/listChar", { pageTitle: "Char", chars });
  } catch {
    req.flash("error", "에러 발생");
    return res.send("error");
  }
};

export const getCreateChar = (req, res) => {
  res.render("char/editChar", { pageTitle: "Create Char" });
};

export const postCreateChar = async (req, res) => {
  const {
    body: { name, classname },
  } = req;

  try {
    if (name === "" || name === undefined) {
      req.flash("error", "캐릭터명을 입력하세요!");
      return res.status(404).redirect("/character/create");
    }

    if (classname === "" || classname === undefined) {
      req.flash("error", "직업을 선택하세요!");
      return res.status(404).redirect("/character/create");
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
    res.redirect("/character");
  } catch {
    req.flash("error", "캐릭터 생성 실패");
    res.redirect("/");
  }
};

export const getCharInfo = async (req, res) => {
  const {
    params: { id },
  } = req;

  try {
    const char = await Character.findById(id)
      .populate("owner", ["name"])
      .populate("parties");

    res.render("char/infoChar", { pageTitle: "Char Info", char });
  } catch {
    req.flash("error", "잘못된 캐릭터ID");
    res.redirect("/");
  }
};

export const getEditChar = async (req, res) => {
  const {
    params: { id },
  } = req;
  try {
    const char = await Character.findById(id);
    res.render("char/editChar", { pageTitle: "Edit Char", char });
  } catch {
    req.flash("error", "잘못된 캐릭터ID");
    res.redirect("/");
  }
};

export const deleteChar = async (req, res) => {
  const {
    params: { id },
  } = req;

  try {
    const char = await Character.findById(id);
    if (char.parties.length !== 0) {
      console.error(new Date());
      console.error(`Can't delete character : ${char.name}`);
      console.error(`Party length is not 0 : ${char.parties.length}`);
      throw "deleteException";
    }
    if (!(char.owner === null || char.owner === undefined)) {
      console.error(new Date());
      console.error(`Character has owner : ${char.owner}`);
      throw "deleteException";
    }
    await Character.findByIdAndDelete(id);
    req.flash("success", "캐릭터 삭제");
  } catch (e) {
    req.flash("error", "삭제 에러");
  } finally {
    return res.redirect("/character");
  }
};
