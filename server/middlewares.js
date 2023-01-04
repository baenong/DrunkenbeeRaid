import Party from "./models/Party";

export const loginMiddleware = (req, res, next) => {
  res.locals.loggedIn = Boolean(req.session.loggedIn);
  res.locals.loggedInUser = req.session.user || {};
  return next();
};

export const protectorMiddleware = (req, res, next) => {
  if (res.locals.loggedIn) {
    return next();
  } else {
    req.flash("error", "로그인 하세요");
    return res.redirect("/login");
  }
};

export const publicOnlyMiddleware = (req, res, next) => {
  if (!res.locals.loggedIn) {
    return next();
  } else {
    req.flash("error", "Not Authorized");
    return res.redirect("/");
  }
};

export const resetParties = async (req, res, next) => {
  await Party.updateMany({}, { weekday: "수", startAt: "08:00" });
  console.log(`[${new Date()}] Reset Party start time`);
  return next();
};
