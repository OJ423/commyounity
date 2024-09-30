const jwt = require('jsonwebtoken')
const { fetchUsersMembershipsByUserID, fetchUserAdminProfiles, loginUserByUserNameValidation, createNewUser, verifyNewUser, verifyUserUpdatePassword, removeUser, editUser, fetchUsersCommunityMemberships, addCommunityUser, removeCommunityUser, addGroupUser, removeGroupUser, addChurchUser, removeChurchUser, fetchAdminUsers } = require('../models/users.model.js')
const { userNameExistsCheck, emailExistsCheck, sendVerificationEmail, sendPasswordResetEmail, checkUserForPasswordReset } = require('./utils.js')

const JWT_SECRET = process.env.JWT_SECRET

exports.getUsersMembershipsByUserID = (req, res, next) => {
  const {community_id} = req.params;
  const {user} = req;
  fetchUsersMembershipsByUserID(user.id, community_id)
  .then((userMemberships) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).send({userMemberships, token})
  })
  .catch(next)
}

exports.getUserAdminProfiles = (req, res, next) => {
  const { community_id} = req.params;
  const {user} = req;
  fetchUserAdminProfiles(user.id, community_id)
  .then((adminOwners) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).send({schools: adminOwners.schools, churches: adminOwners.churches, businesses: adminOwners.businesses, groups: adminOwners.groups, token})
  })
  .catch(next)
}


exports.loginUserByUserName = (req, res, next) => {
  const { body } = req;

  loginUserByUserNameValidation(body)
    .then(user => {
      return fetchUsersCommunityMemberships(user.user_id).then(communities => {
        return { user, communities };
      });
    })
    .then(loginData => {
      const { user, communities } = loginData;
      const token = jwt.sign({ id: user.user_id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
      res.status(200).send({ user, communities, token });
    })
    .catch(next);
};

exports.registerUser = (req, res, next) => {
  const { body } = req;
  const checkUserName = userNameExistsCheck(body);
  const checkEmail = emailExistsCheck(body);

  Promise.all([checkUserName, checkEmail])
    .then(() => {
      return createNewUser(body);
    })
    .then(newUser => {
      const verificationToken = jwt.sign({ email: newUser.user_email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      sendVerificationEmail(newUser.user_email, verificationToken);
      res.status(201).send({ msg: 'User registered successfully. Please check your email to verify your account.' });
    })
    .catch(next);
};

exports.verifyUser = (req, res, next) => {
  const {token} = req.query;
  verifyNewUser(token)
  .then((newUser) => {
    const token = jwt.sign({ id: newUser.user_id, username: newUser.username }, JWT_SECRET, { expiresIn: '1h' });
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

exports.patchUser = (req, res, next) => {
  const {user_id} = req.params;
  const {body, user} = req;
  editUser(user_id, body)
  .then((editedUser) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({user: editedUser, token})
  })
  .catch(next)
}

exports.joinCommunity = (req, res, next) => {
  const {body, user} = req;
  addCommunityUser(body)
  .then((community) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).send({msg: "Successfully joined community", community, token})
  })
  .catch(next)
}

exports.leaveCommunity = (req, res, next) => {
  const {user_id, community_id} = req.params;
  const {user} = req;
  removeCommunityUser(user_id, community_id)
  .then((response) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({msg: "Successfully left the community", deleted: response, token})
  })
  .catch(next)
}

exports.joinGroup = (req, res, next) => {
  const {body, user} = req;
  addGroupUser(body)
  .then((group) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).send({msg: "Successfully joined group", group, token})
  })
  .catch(next)
}

exports.leaveGroup = (req, res, next) => {
  const {user_id, group_id} = req.params;
  const {user} = req;
  removeGroupUser(user_id, group_id)
  .then((response) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({msg: "Successfully left the group", deleted: response, token})
  })
  .catch(next)
}

exports.joinChurch = (req, res, next) => {
  const {body, user} = req;
  addChurchUser(body)
  .then((church) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).send({msg: "Successfully joined church", church, token})
  })
  .catch(next)
}

exports.leaveChurch = (req, res, next) => {
  const {user_id, church_id} = req.params;
  const {user} = req;
  removeChurchUser(user_id, church_id)
  .then((response) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({msg: "Successfully left the church", deleted: response, token})
  })
  .catch(next)
}

// Generic get admin users for entity (group/business etc)

exports.getAdminUsers = (req, res, next) => {
  const {type, entityId} = req.params;
  const {user} = req;
  fetchAdminUsers(user.id, type, entityId)
  .then((adminUsers) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({adminUsers, token})
  })
  .catch(next)
}