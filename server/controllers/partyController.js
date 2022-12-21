import Character from "../models/Character.js";
import Party from "../models/Party.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";

const week = ["수", "목", "금", "토", "일", "월", "화"];

export const home = async (req, res) => {
  try {
    const parties = await Party.find({}).populate("members");
    return res.render("home", { pageTitle: "Home", parties });
  } catch {
    req.flash("error", "에러 발생");
    return res.send("error");
  }
};

/**
 * Search : 캐릭터, 유저, hashtag로 검색가능
 * @param {*} req
 * @param {*} res
 */
export const search = async (req, res) => {
  const { keyword } = req.query;
  let parties = [];

  if (keyword) {
    if (keyword.startsWith("#")) {
      parties = await Party.find({ hashtags: keyword })
        .sort({ weekday: "desc" })
        .populate("members");
    } else {
      parties = await Party.find({
        $or: [
          { title: { $regex: new RegExp(keyword, "i") } },
          { weekday: keyword },
        ],
      })
        .sort({ weekday: "desc" })
        .populate("members");
    }
  }
  return res.render("home", { pageTitle: "Search", parties });
};

/**
 * 파티 정보 보기(id 받아서)
 * @param {*} req
 * @param {*} res
 */
export const showPartyInfo = async (req, res) => {
  const {
    params: { id },
  } = req;

  const party = await Party.findById(id).populate("members");
  const comments = await Comment.find({ party: id }).populate("owner");
  res.render("partyInfo", { pageTitle: "Party Info", party, comments });
};

export const getCreateParty = async (req, res) => {
  const freeChars = await Character.find({});
  res.render("createParty", { pageTitle: "Create Party", freeChars });
};

export const postCreateParty = async (req, res) => {
  const {
    body: { title, weekday, startAt, chars, hashtags },
  } = req;

  try {
    const realTitle = title === undefined || title === "" ? "지옥팟" : title;
    const newParty = await Party.create({
      title: realTitle,
      members: chars,
      weekday: convertNumToWeek(weekday),
      startAt,
      hashtags: Party.formatHashtags(hashtags),
    });

    // 멤버에 변경하는 알고리즘
    await Character.updateMany(
      { _id: { $in: chars } },
      {
        $push: { parties: newParty._id },
      }
    );

    // 기존 파티에서 제거하는 알고리즘
    // 레이드 별로 나눌 지 고민 중
  } catch (error) {
    req.flash("error", "에러 발생");
    console.log(error);
  }

  return res.redirect("/");
};

export const getWeekParty = async (req, res) => {
  const wedParty = await Party.find({ weekday: "수" })
    .sort({ startAt: "asc" })
    .populate("members");
  const thuParty = await Party.find({ weekday: "목" })
    .sort({ startAt: "desc" })
    .populate("members");
  const friParty = await Party.find({ weekday: "금" })
    .sort({ startAt: "desc" })
    .populate("members");
  const satParty = await Party.find({ weekday: "토" })
    .sort({ startAt: "desc" })
    .populate("members");
  const sunParty = await Party.find({ weekday: "일" })
    .sort({ startAt: "desc" })
    .populate("members");
  const monParty = await Party.find({ weekday: "월" })
    .sort({ startAt: "desc" })
    .populate("members");
  const tueParty = await Party.find({ weekday: "화" })
    .sort({ startAt: "desc" })
    .populate("members");
  const parties = [
    wedParty,
    thuParty,
    friParty,
    satParty,
    sunParty,
    monParty,
    tueParty,
  ];
  res.render("week", { pageTitle: "Week", parties, week });
};

export const selectWeekParty = async (req, res) => {
  const {
    query: { keyword },
  } = req;

  const parties = await Party.find({ weekday: keyword })
    .sort({ startAt: "asc" })
    .populate("members");

  res.render("week", { pageTitle: "Week", parties, week, keyword });
};

export const deleteParty = async (req, res) => {
  const {
    params: { id },
  } = req;

  try {
    const selectedParty = await Party.findById(id);
    await Character.updateMany(
      {
        _id: { $in: selectedParty.members },
      },
      {
        $pull: { parties: selectedParty._id },
      }
    );

    await Party.findByIdAndDelete(id);

    req.flash("success", "파티 삭제됨");
  } catch (error) {
    req.flash("error", "에러 발생");
    console.log(error);
  }
  return res.redirect("/");
};

export const getEditParty = async (req, res) => {
  const {
    params: { id },
  } = req;
  const selectedParty = await Party.findById(id).populate("members");
  const members = selectedParty.members;
  const freeChars = await Character.find({ _id: { $not: { $in: members } } });

  selectedParty.weekday = convertWeekToNum(selectedParty.weekday);
  res.render("createParty", {
    pageTitle: "Create Party",
    freeChars,
    members,
    selectedParty,
  });
};

export const postEditParty = async (req, res) => {
  const {
    body: { title, weekday, startAt, existing, chars, hashtags },
    params: { id },
  } = req;

  try {
    // 기존 멤버들에서 id 제거
    await Character.updateMany(
      {
        _id: { $in: existing },
      },
      {
        $pull: { parties: id },
      }
    );

    const week = convertNumToWeek(weekday);
    await Party.findByIdAndUpdate(id, {
      title,
      members: chars,
      weekday: week,
      startAt,
      hashtags: Party.formatHashtags(hashtags),
    });

    // 멤버에 변경하는 알고리즘
    await Character.updateMany(
      { _id: { $in: chars } },
      { $push: { parties: id } }
    );

    // 레이드 별로 나눌 지 고민 중
  } catch (error) {
    req.flash("error", "에러 발생");
    console.log(error);
  }

  return res.redirect(`/party/${id}`);
};

export const postEditComment = async (req, res) => {
  const {
    body: { text, commenter },
    params: { id },
  } = req;

  const owner = await User.findOne({ name: commenter });

  if (!owner) {
    req.flash("error", "유저이름이 적절치 않음");
    return res.sendStatus(404);
  }

  const comment = await Comment.create({
    owner,
    text,
    party: id,
  });

  const party = await Party.findById(id);

  owner.comments.push(comment._id);
  owner.save();
  party.comments.push(comment._id);
  party.save();

  return res.status(201).json({
    name: owner.name,
    createdAt: comment.createdAt,
    id: comment._id,
  });
};

export const getDeleteComment = async (req, res) => {
  const {
    params: { id },
  } = req;

  const comment = await Comment.findById(id);
  const user = await User.findById(comment.owner);
  const party = await Party.findById(comment.party);

  if (!comment) {
    return res.status(400).render("404", { pageTitle: "Comment not found." });
  }

  await Comment.findByIdAndDelete(id);
  user.comments.splice(user.comments.indexOf(id), 1);
  user.save();

  party.comments.splice(party.comments.indexOf(id), 1);
  party.save();

  req.flash("success", "댓글 삭제됨");
  return res.redirect(`/party/${party._id}`);
};

/**
 *
 * @param {*} weekday : String
 * @returns
 */
const convertNumToWeek = (weekday) => {
  const weeknum = Number(weekday);

  return week[weeknum];
};

const convertWeekToNum = (weeknum) => {
  switch (weeknum) {
    case "수":
      return "0";
    case "목":
      return "1";
    case "금":
      return "2";
    case "토":
      return "3";
    case "일":
      return "4";
    case "월":
      return "5";
    case "화":
      return "6";
  }
};
