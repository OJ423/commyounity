const bcrypt = require('bcryptjs') 

exports.hashPasswords = ({username, user_bio,user_email,community_owner, church_owner, school_owner, password}) => {
  const salt = bcrypt.genSaltSync(1);
  const hash = bcrypt.hashSync(password, salt);
  return {
    username,
    user_bio,
    user_email,
    community_owner, 
    church_owner, 
    school_owner, 
    password: hash
  }
}