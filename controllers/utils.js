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
    html: `<img src="http://localhost:3000/Commyounity.svg" width=200px height=auto />
    <p><strong>Hello and welcome to Commyounity</strong>. Thanks for signing up</p>
    <p>To start, please <a href="${url}">click here</a> or the link below to verify your email address:</p>
    <a href="${url}">${url}</a>`
  };

  transporter.sendMail(mailOptions)
    .catch(error => {
      console.error('Error sending email:', error);
    });
}


exports.sendLoginConfirmEmail = (username, email, token) => {
  const url = `http://localhost:3000/login/confirm?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Login to Comm-you-nity',
    html: `<img src="http://localhost:3000/Commyounity.svg" width=200px height=auto />
    <p><strong>Welcome back ${username}</strong>.</p>
    <p>To login, please <a href="${url}">click here</a> or the link below to verify that it's you</p>
    <a href="${url}">${url}</a>`
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
    html: `<p>Please click the link to reset your password: <a href="${url}">${url}</a></p>`
  };

  transporter.sendMail(mailOptions)
    .catch(error => {
      console.error('Error sending email:', error);
    });
}

exports.sendSchoolParentRejection = (email, username) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to:email,
    subject: 'School Access Rejected',
    html: `Dear ${username}, You requested access to a school's posts. Your request was rejected by the school. If this is incorrect, please contact the school directly.`
  }

  transporter.sendMail(mailOptions)
    .catch(err => {
      console.error('Error sending email:', errror)
    })
}

exports.sendSchoolParentApproved = (email, username) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to:email,
    subject: 'School Access Accepted',
    html: `Dear ${username}, You requested access to a school's posts. Your request has been approved by the school.`
  }

  transporter.sendMail(mailOptions)
    .catch(err => {
      console.error('Error sending email:', errror)
    })
}