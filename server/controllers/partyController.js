import Character from "../models/Character.js";
import Party from "../models/Party.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";

const week = ["수", "목", "금", "토", "일", "월", "화"];

export const home = async (req, res) => {
  try {
    const parties = await Party.find({})
      .sort({ employ: -1, weekday: "desc" })
      .populate("members", "name");
    return res.render("home", { pageTitle: "Home", parties });
  } catch {
    req.flash("error", "에러 발생");
    res.redirect("/");
  }
};

export const search = async (req, res) => {
  const { keyword } = req.query;
  let parties = [];

  try {
    if (keyword) {
      if (keyword.startsWith("#")) {
        parties = await Party.find({ hashtags: keyword })
          .sort({ employ: -1, weekday: "desc" })
          .populate("members", "name");
      } else {
        parties = await Party.find({
          $or: [
            { title: { $regex: new RegExp(keyword, "i") } },
            { weekday: keyword },
          ],
        })
          .sort({ employ: -1, weekday: "desc" })
          .populate("members", "name");
      }
    }
    return res.render("home", { pageTitle: "Search", parties });
  } catch {
    req.flash("error", "오류 발생");
    res.redirect("/");
  }
};

export const showPartyInfo = async (req, res) => {
  const {
    params: { id },
  } = req;

  try {
    const party = await Party.findById(id).populate("members", "name");
    const comments = await Comment.find(
      { party: id },
      { party: false }
    ).populate("owner", "name");
    res.render("party/infoParty", { pageTitle: "Party Info", party, comments });
  } catch {
    req.flash("error", "잘못된 파티ID");
    res.redirect("/");
  }
};

export const getCreateParty = async (req, res) => {
  const freeChars = await Character.find({}, { name: true, parties: true });
  res.render("party/editParty", { pageTitle: "Create Party", freeChars });
};

export const postCreateParty = async (req, res) => {
  const {
    body: { title, weekday, startAt, chars, hashtags },
  } = req;

  try {
    const realTitle = title === undefined || title === "" ? "지옥팟" : title;
    const employ = realTitle.includes("구함") ? true : false;

    const newParty = await Party.create({
      title: realTitle,
      members: chars,
      weekday: convertNumToWeek(weekday),
      startAt,
      hashtags: Party.formatHashtags(hashtags),
      employ,
    });

    pushParties(newParty._id, chars);
  } catch (error) {
    req.flash("error", "에러 발생");
  }

  return res.redirect("/");
};

export const getWeekParty = async (req, res) => {
  try {
    const parties = [];
    const wedParty = await Party.find(
      { weekday: "수", startAt: { $gt: "10:00" } },
      { title: true, startAt: true, members: true }
    )
      .sort({ startAt: "asc" })
      .populate("members", "name");

    parties.push(wedParty);

    for (let cnt = 1; cnt < 7; cnt++) {
      parties.push(
        await Party.find(
          { weekday: week[cnt] },
          { title: true, startAt: true, members: true }
        )
          .sort({ startAt: "asc" })
          .populate("members", "name")
      );
    }

    let todayWeek = new Date().getDay() - 3;
    if (todayWeek < 0) {
      todayWeek = todayWeek + 7;
    }

    return res.render("party/weekParty", {
      pageTitle: "Week",
      parties,
      week,
      todayWeek,
    });
  } catch (e) {
    req.flash("error", "파티 조회 실패");
    console.error(new Date(), e);
    res.redirect("/");
  }
};

export const selectWeekParty = async (req, res) => {
  const {
    query: { keyword },
  } = req;

  try {
    let parties;
    if (keyword === "수") {
      parties = await Party.find(
        { weekday: "수", startAt: { $gt: "10:00" } },
        { title: true, startAt: true, members: true }
      )
        .sort({ startAt: "asc" })
        .populate("members", "name");
    } else {
      parties = await Party.find(
        { weekday: keyword },
        { title: true, startAt: true, members: true }
      )
        .sort({ startAt: "asc" })
        .populate("members", "name");
    }

    return res.render("party/weekParty", {
      pageTitle: "Week",
      parties,
      week,
      keyword,
    });
  } catch (e) {
    req.flash("error", "파티 조회 실패");
    console.error(new Date(), e);
    res.redirect("/");
  }
};

export const deleteParty = async (req, res) => {
  const {
    params: { id },
  } = req;

  try {
    const selectedParty = await Party.findById(id, { members: true });

    pullParties(id, selectedParty.members);

    const comments = await Comment.find(
      { party: id },
      { createdAt: false, text: false }
    );
    comments.forEach(async (elem) => {
      await deleteCommentOnce(elem);
    });

    await Party.findByIdAndDelete(id);

    req.flash("success", "파티 삭제됨");
  } catch (e) {
    req.flash("error", "에러 발생");
    console.error(new Date(), e);
  } finally {
    return res.redirect("/");
  }
};

export const getEditParty = async (req, res) => {
  const {
    params: { id },
  } = req;

  try {
    const selectedParty = await Party.findById(id, {
      comments: false,
    }).populate("members");
    const members = selectedParty.members;
    const freeChars = await Character.find(
      { _id: { $not: { $in: members } } },
      { name: 1, parties: 1 }
    );

    selectedParty.weekday = convertWeekToNum(selectedParty.weekday);
    return res.render("party/editParty", {
      pageTitle: "Create Party",
      freeChars,
      members,
      selectedParty,
    });
  } catch {
    req.flash("error", "파티 혹은 캐릭터 조회 실패");
    res.redirect("/");
  }
};

export const postEditParty = async (req, res) => {
  const {
    body: { title, weekday, startAt, existing, chars, hashtags },
    params: { id },
  } = req;

  try {
    pullParties(id, existing);

    const week = convertNumToWeek(weekday);
    const employ = title.includes("구함") ? true : false;
    await Party.findByIdAndUpdate(id, {
      title,
      members: chars,
      weekday: week,
      startAt,
      hashtags: Party.formatHashtags(hashtags),
      employ,
    });

    pushParties(id, chars);
  } catch (error) {
    req.flash("error", "에러 발생");
    return res.redirect("/");
  }

  return res.redirect(`/party/${id}`);
};

export const postEditComment = async (req, res) => {
  const {
    body: { text, commenter },
    params: { id },
  } = req;

  try {
    const owner = await User.findOne({ name: commenter }, { name: 1 });

    if (!owner) {
      req.flash("error", "유저이름이 적절치 않음");
      return res.sendStatus(404);
    }

    const comment = await Comment.create({
      owner,
      text,
      party: id,
    });

    await User.updateOne(
      { name: commenter },
      { $push: { comments: comment._id } }
    );
    await Party.findByIdAndUpdate(id, { $push: { comments: comment._id } });

    return res.status(201).json({
      name: owner.name,
      createdAt: comment.createdAt,
      id: comment._id,
    });
  } catch {
    req.flash("error", "에러 발생");
    res.redirect("/");
  }
};

export const getDeleteComment = async (req, res) => {
  const {
    params: { id },
  } = req;

  try {
    const comment = await Comment.findById(id, {
      createdAt: false,
      text: false,
    });

    if (!comment) {
      return res.status(400).render("404", { pageTitle: "Comment not found." });
    }

    deleteCommentOnce(comment);

    req.flash("success", "댓글 삭제됨");
    return res.redirect(`/party/${comment.party}`);
  } catch {
    req.flash("error", "댓글 삭제 실패");
    res.redirect("/");
  }
};

const deleteCommentOnce = async (comment) => {
  await Comment.findByIdAndDelete(comment._id);
  await User.findByIdAndUpdate(comment.owner, {
    $pull: { comments: comment._id },
  });
  await Party.findByIdAndUpdate(comment.party, {
    $pull: { comments: comment._id },
  });
};

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

const pushParties = async (partyId, charList) => {
  await Character.updateMany(
    { _id: { $in: charList } },
    { $push: { parties: partyId } }
  );

  const owners = await Character.find(
    { _id: { $in: charList } },
    { _id: false, owner: true }
  );
  let ownerIds = [];
  owners.forEach((elem) => {
    ownerIds.push(elem.owner);
  });

  await User.updateMany(
    { _id: { $in: ownerIds } },
    {
      $push: { parties: partyId },
    }
  );
};

const pullParties = async (partyId, existing) => {
  await Character.updateMany(
    {
      _id: { $in: existing },
    },
    {
      $pull: { parties: partyId },
    }
  );

  const owners = await Character.find(
    { _id: { $in: existing } },
    { _id: false, owner: true }
  );

  const ownerIds = [];
  owners.forEach((elem) => {
    ownerIds.push(elem.owner);
  });

  await User.updateMany(
    { _id: { $in: ownerIds } },
    {
      $pull: { parties: partyId },
    }
  );
};
