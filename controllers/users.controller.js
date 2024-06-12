const jwt = require('jsonwebtoken')
const {fetchUsersMembershipsByUserID, fetchUserAdminProfiles, fetchUserBusinesses, fetchUserGroups, loginUserByUserNameValidation, createNewUser, verifyNewUser, verifyUserUpdatePassword, removeUser} = require('../models/users.model.js')
const { userNameExistsCheck, emailExistsCheck, sendVerificationEmail, sendPasswordResetEmail, checkUserForPasswordReset } = require('./utils.js')

const JWT_SECRET = process.env.JWT_SECRET

exports.getUsersMembershipsByUserID = (req, res, next) => {
  const {user_id, community_id} = req.params
  fetchUsersMembershipsByUserID(user_id, community_id)
  .then((user) => {
    res.status(200).send({user})
  })
  .catch(next)
}

exports.getUserAdminProfiles = (req, res, next) => {
  const {user_id, community_id} = req.params
  const schoolChurchOwner = fetchUserAdminProfiles(user_id)
  const businessOwner = fetchUserBusinesses(user_id)
  const userGroups = fetchUserGroups(user_id)
  Promise.all([schoolChurchOwner, businessOwner, userGroups])
  .then((admin) => {
    const schoolChurch = admin[0]
    const businesses = admin[1]
    const userGroups = admin[2]
    res.status(200).send({school: schoolChurch.school, church: schoolChurch.church, community: schoolChurch.community, businesses, groups: userGroups})
  })
  .catch(next)
}


exports.loginUserByUserName = (req, res, next) => {
  const {body} = req
  loginUserByUserNameValidation(body)
  .then((user) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).send({ user, token });
  })
  .catch(next)
}

exports.registerUser = (req, res, next) => {
  const {body} = req;
  const newUser = createNewUser(body)
  const checkUserName = userNameExistsCheck(body)
  const checkEmail = emailExistsCheck(body)
  Promise.all([newUser, checkUserName, checkEmail])
  .then((newUserArr) => {
    const newUser = newUserArr[0]
    const verificationToken = jwt.sign({ email: newUser.user_email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    sendVerificationEmail(newUser.user_email, verificationToken)
    res.status(201).send({msg: 'User registered successfully. Please check your email to verify your account.'})
  })
  .catch(next)
}

exports.verifyUser = (req, res, next) => {
  const {token} = req.query;
  verifyNewUser(token)
  .then((newUser) => {
    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).send({msg:'Email verified successfully. Your account is now active.', user:newUser, token})
  })
  .catch(next)
}

exports.forgotPasswordRequest = (req, res, next) => {
  const {body} = req
  checkUserForPasswordReset(body)
  .then((userEmail) => {
    const verificationToken = jwt.sign({ email: userEmail.user_email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    sendPasswordResetEmail(userEmail.user_email, verificationToken)
    res.status(200).send({msg: 'Please check your email to change your password.'})
  })
  .catch(next)
}

exports.updateUserPassword = (req, res, next) => {
  const {token} = req.query;
  const {body} = req;
  verifyUserUpdatePassword(body.password, token)
  .then((user) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).send({msg: 'You password has been changed successfully.', user, token})
  })
  .catch(next)
}

exports.deleteUser = (req, res, next) => {
  const {user_id} = req.params
  removeUser(user_id)
  .then((deleteMsg) => {
    res.status(200).send({msg: 'User deleted.'})
  })
  .catch(next)
}