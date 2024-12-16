const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

exports.authNonCritical = (req, res, next) => {
  const authHeader = req.headers.authorization;
  let hasToken = false;
  if (!authHeader) {
    hasToken = false;
  } else {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        hasToken = false;
      }
      hasToken = true;
      req.user = user;
    });
  }
  req.hasToken = hasToken;
  next();
};
