const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({msg: "Authorization header missing"})
  }

  const token = authHeader.split(' ')[1]

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).send({msg: "Invalid or expired token"});
    }
    req.user = user;
    console.log(user)
    next();
  });
}