const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

exports.authNonCritical = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    req.hasToken = false;
    return next();
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.hasToken = false;
      return next(); // Allow the request to proceed
    }

    req.hasToken = true;
    req.user = user; // Attach user details to the request
    next();
  });
}
