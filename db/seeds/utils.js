const bcrypt = require('bcryptjs') 

exports.hashPasswords = ({username, user_bio,user_email,user_avatar, password, status}) => {
  const salt = bcrypt.genSaltSync(1);
  const hash = bcrypt.hashSync(password, salt);
  return {
    username,
    user_bio,
    user_email,
    user_avatar,
    password: hash,
    status
  }
}