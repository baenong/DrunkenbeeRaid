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

/**
 *
 * @event 2022. 12. 22. 유저 정보에 달았던 코멘트들도 불러오기
 * view도 수정
 */
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
    return res.render("userInfo", { pageTitle: "User", user, week });
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
    const chars = await Character.find({})
      .sort({ owner: "asc" })
      .populate("owner", "name");
    return res.render("createUser", { pageTitle: "Edit User", chars, user });
  } catch {
    req.flash("error", "잘못된 유저ID");
    res.redirect("/");
  }
};

export const postEditUser = async (req, res) => {
  const {
    body: { name, chars },
    params: { id },
  } = req;

  try {
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
    const partyIds = [];

    selectedChars.map((elem) => {
      oldOwnerIds.push(elem.owner);
      elem.parties.map((party) => {
        partyIds.push(party);
      });
    });
    console.log(partyIds);

    await User.updateMany(
      { _id: { $in: oldOwnerIds } },
      {
        $pull: { characters: { $in: chars }, parties: { $in: partyIds } },
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
      name,
      characters: chars === undefined ? [] : chars,
      parties: partyIds,
    });

    return res.redirect(`/user/${id}`);
  } catch {
    req.flash("error", "에러 발생");
    res.redirect("/");
  }
};

export const getCreateUser = async (req, res) => {
  try {
    // 캐릭터 소유주가 없는 캐릭터만 목록 불러오기
    const chars = await Character.find({})
      .sort({ owner: "asc" })
      .populate("owner", "name");
    return res.render("createUser", { pageTitle: "Create User", chars });
  } catch {
    req.flash("error", "캐릭터 목록 조회 실패");
    res.redirect("/");
  }
};

export const postCreateUser = async (req, res) => {
  const {
    body: { name, chars },
  } = req;

  try {
    if (name === "" || name === undefined) {
      req.flash("error", "유저명을 입력하세요!");
      return res.status(404).redirect("/user/create");
    }

    const isExists = await User.findOne({ name });
    let newUser;

    /**owner가 이미 있는 캐릭터의 경우 */
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

    if (!isExists) {
      // 신규 생성
      newUser = await User.create({
        name,
        characters: chars,
        parties: partyIds,
      });

      req.flash("success", `${name} 생성됨`);
    } else {
      // Update!
      newUser = await User.findByIdAndUpdate(isExists._id, {
        name,
        characters: chars,
        parties: partyIds,
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

    return res.redirect("/user");
  } catch {
    req.flash("error", "에러 발생");
    res.redirect("/");
  }
};
