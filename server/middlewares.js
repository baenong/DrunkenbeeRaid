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
