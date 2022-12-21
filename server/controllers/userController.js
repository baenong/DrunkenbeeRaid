import User from "../models/User.js";
import Character from "../models/Character.js";

export const getUserList = async (req, res) => {
  //db.collection.find('name': { $exists: false }) : 값이 없는 컬럼만 불러오기
  try {
    const users = await User.find({}).populate("characters");
    return res.render("userlist", { pageTitle: "User", users });
  } catch {
    req.flash("error", "에러 발생");
    return res.send("error");
  }
};

export const getUserInfo = async (req, res) => {
  const {
    params: { id },
  } = req;

  const user = await User.findById(id).populate("characters");
  res.render("userInfo", { pageTitle: "User", user });
};

export const getEditUser = async (req, res) => {
  const {
    params: { id },
  } = req;

  const user = await User.findById(id).populate("characters");
  const chars = await Character.find({})
    .sort({ owner: "asc" })
    .populate("owner");
  res.render("createUser", { pageTitle: "Edit User", chars, user });
};

export const postEditUser = async (req, res) => {
  const {
    body: { name, chars },
    params: { id },
  } = req;

  // 기존에 선택되었었던 유저들 업데이트
  const user = await User.findById(id);
  await Character.updateMany(
    { _id: { $in: user.characters } },
    {
      owner: null,
    }
  );

  /**owner가 이미 있는 캐릭터의 경우 */
  const selectedChars = await Character.find({ _id: { $in: chars } });
  const oldOwnerIds = [];
  selectedChars.map((elem) => {
    oldOwnerIds.push(elem.owner);
  });

  await User.updateMany(
    { _id: { $in: oldOwnerIds } },
    {
      $pull: { characters: { $in: chars } },
    }
  );

  // 새로 선택된 유저 업데이트
  // character update
  await Character.updateMany(
    { _id: { $in: chars } },
    {
      owner: id,
    }
  );

  await User.findByIdAndUpdate(id, {
    characters: chars,
  });

  res.redirect(`/user/${id}`);
};

export const getCreateUser = async (req, res) => {
  // 캐릭터 소유주가 없는 캐릭터만 목록 불러오기
  const chars = await Character.find({})
    .sort({ owner: "asc" })
    .populate("owner");
  return res.render("createUser", { pageTitle: "Create User", chars });
};

export const postCreateUser = async (req, res) => {
  const {
    body: { name, chars },
  } = req;

  const isExists = await User.findOne({ name });
  let newUser;

  /**owner가 이미 있는 캐릭터의 경우 */
  const selectedChars = await Character.find({ _id: { $in: chars } });
  const oldOwnerIds = [];
  selectedChars.map((elem) => {
    oldOwnerIds.push(elem.owner);
  });

  await User.updateMany(
    { _id: { $in: oldOwnerIds } },
    {
      $pull: { characters: { $in: chars } },
    }
  );

  if (!isExists) {
    // 신규 생성
    newUser = await User.create({
      name,
      characters: chars,
    });

    req.flash("success", `${name} 생성됨`);
  } else {
    // Update!
    newUser = await User.findByIdAndUpdate(isExists._id, {
      name,
      characters: chars,
    });
    req.flash("info", `${name} 변경됨`);
  }

  // character update
  await Character.updateMany(
    { _id: { $in: chars } },
    {
      owner: newUser._id,
    }
  );

  return res.redirect("/");
};
