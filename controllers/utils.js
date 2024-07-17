const {db} = require('../db/connection')
const nodemailer = require('nodemailer');

exports.existingCommunityCheck = (body) => {
  const {community_name} = body
  return db.query(`
    SELECT * FROM communities
    WHERE community_name = $1
  `, [community_name])
  .then(({rows}) => {
    if(rows.length) {
      return Promise.reject({status:400, msg: 'Community already exists.'})
    }
  })
}

exports.userNameExistsCheck = ({username}) => {
  return db.query(`
    SELECT username FROM users
    WHERE username = $1`
  , [username])
  .then(({rows}) => {
    if (rows.length) {
      return Promise.reject({status: 400, msg: 'Username already exists. Must be unique.'})
    }
  })
  .catch((error) => {
    throw error
  })
}

exports.emailExistsCheck = ({email}) => {
  return db.query(`
    SELECT user_email FROM users
    WHERE user_email = $1`
  , [email])
  .then(({rows}) => {
    if (rows.length) {
      return Promise.reject({status: 400, msg: 'Email already exists. Must be unique.'})
    }
  })
  .catch((error) => {
    throw error
  })
}

exports.checkUserForPasswordReset = ({email}) => {
  return db.query(`
    SELECT user_email FROM users
    WHERE user_email = $1`
  ,[email])
  .then(({rows}) => {
    if (!rows.length) {
      return Promise.reject({status: 400, msg: 'Cannot find user email'})
    }
    return rows[0]
  })
}


const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
});

exports.sendVerificationEmail = (email, token) => {
  const url = `http://localhost:3000/verify-email?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Comm-you-nity Verification Email',
    html: `Please click the link to verify your email address: <a href="${url}">${url}</a>`
  };

  transporter.sendMail(mailOptions)
    .catch(error => {
      console.error('Error sending email:', error);
    });
}


exports.sendPasswordResetEmail = (email, token) => {
  const url = `http://localhost:3000/update-password?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Comm-you-nity Password Reset',
    html: `Please click the link to reset your password: <a href="${url}">${url}</a>`
  };

  transporter.sendMail(mailOptions)
    .catch(error => {
      console.error('Error sending email:', error);
    });
}