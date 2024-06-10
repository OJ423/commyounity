const bcrypt = require('bcryptjs') 

exports.hashPasswords = ({username, user_bio,user_email,user_avatar, community_owner, church_owner, school_owner, password, status}) => {
  const salt = bcrypt.genSaltSync(1);
  const hash = bcrypt.hashSync(password, salt);
  return {
    username,
    user_bio,
    user_email,
    user_avatar,
    community_owner, 
    church_owner, 
    school_owner, 
    password: hash,
    status
  }
}