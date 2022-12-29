import User from "../models/User.js";
import Character from "../models/Character.js";

export const getUserList = async (req, res) => {
  try {
    const users = await User.find(
      {},
      { name: true, characters: true }
    ).populate({
      path: "characters",
      select: ["name", "classname"],
    });
    return res.render("user/listUser", { pageTitle: "User", users });
  } catch {
    req.flash("error", "에러 발생");
    return res.send("error");
  }
};

export const getUserInfo = async (req, res) => {
  const {
    params: { id },
  } = req;
  const week = ["수", "목", "금", "토", "일", "월", "화"];
  try {
    const user = await User.findById(id)
      .populate("characters", "name")
      .populate({
        path: "comments",
        populate: { path: "party", select: "title" },
      })
      .populate({
        path: "parties",
        select: ["title", "weekday", "startAt"],
        options: { sort: { startAt: "asc" } },
      });
    return res.render("user/infoUser", { pageTitle: "User", user, week });
  } catch {
    req.flash("error", "잘못된 유저ID");
    res.redirect("/");
  }
};

export const getEditUser = async (req, res) => {
  const {
    params: { id },
  } = req;

  try {
    const user = await User.findById(id);
    const chars = await Character.find({}, { classname: false })
      .sort({ owner: "asc" })
      .populate("owner", "name");
    return res.render("user/editUser", { pageTitle: "Edit User", chars, user });
  } catch {
    req.flash("error", "잘못된 유저ID");
    res.redirect("/");
  }
};

export const postEditUser = async (req, res) => {
  const {
    body: { name, chars, memo },
    params: { id },
  } = req;

  try {
    const user = await User.findById(id);
    await Character.updateMany(
      { _id: { $in: user.characters } },
      {
        owner: null,
      }
    );

    const selectedChars = await Character.find({ _id: { $in: chars } });
    const oldOwnerIds = [];
    const partyIds = [];

    selectedChars.map((elem) => {
      oldOwnerIds.push(elem.owner);
      elem.parties.map((party) => {
        partyIds.push(party);
      });
    });

    await User.updateMany(
      { _id: { $in: oldOwnerIds } },
      {
        $pull: { characters: { $in: chars }, parties: { $in: partyIds } },
      }
    );

    await Character.updateMany(
      { _id: { $in: chars } },
      {
        owner: id,
      }
    );

    await User.findByIdAndUpdate(id, {
      name,
      characters: chars === undefined ? [] : chars,
      parties: partyIds,
      memo,
    });

    return res.redirect(`/user/${id}`);
  } catch {
    req.flash("error", "에러 발생");
    res.redirect("/");
  }
};

export const getCreateUser = async (req, res) => {
  try {
    const chars = await Character.find({}, { classname: false })
      .sort({ owner: "asc" })
      .populate("owner", "name");
    return res.render("user/editUser", { pageTitle: "Create User", chars });
  } catch {
    req.flash("error", "캐릭터 목록 조회 실패");
    res.redirect("/");
  }
};

export const postCreateUser = async (req, res) => {
  const {
    body: { name, chars, memo },
  } = req;

  try {
    if (name === "" || name === undefined) {
      req.flash("error", "유저명을 입력하세요!");
      return res.status(404).redirect("/user/create");
    }

    const isExists = await User.exists({ name });
    if (isExists) {
      req.flash("error", `이미 있는 유저입니다`);
      return res.status(404).redirect("/user/create");
    }
    const selectedChars = await Character.find({ _id: { $in: chars } });
    const oldOwnerIds = [];
    const partyIds = [];

    selectedChars.map((elem) => {
      oldOwnerIds.push(elem.owner);
      elem.parties.map((party) => {
        partyIds.push(party);
      });
    });

    await User.updateMany(
      { _id: { $in: oldOwnerIds } },
      {
        $pull: { characters: { $in: chars }, parties: { $in: partyIds } },
      }
    );

    const newUser = await User.create({
      name,
      characters: chars,
      parties: partyIds,
      memo,
    });

    req.flash("success", `${name} 생성됨`);

    await Character.updateMany(
      { _id: { $in: chars } },
      {
        owner: newUser._id,
      }
    );

    return res.redirect("/user");
  } catch {
    req.flash("error", "에러 발생");
    res.redirect("/");
  }
};
