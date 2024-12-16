const {fetchAllCommunities, fetchCommunityBusinesses, fetchCommunityGroups, fetchCommunitySchools, fetchCommunityChurches, insertCommunity, editCommunity, fetchCommunityById, addCommunityAdmin, blockUser, unblockUser, fetchBlockedUsers, fetchCommunityMembers, fetchCommunityAdmins, addCommunityAdminById, removeCommunityAdmin} = require('../models/communities.model');
const { removeCommunityUser } = require('../models/users.model');
const { existingCommunityCheck } = require('./utils');

const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET

exports.getAllCommunities = (req, res, next) => {
  const {user, hasToken} = req
  fetchAllCommunities()
  .then((communities) => {
    let token = null;
    if(hasToken) {
      token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    }
    res.status(200).send({communities, token})
  })
  .catch(next)
}

exports.getCommunityById = (req, res, next) => {
  const {community_id} = req.params;
  const {user, hasToken} = req;
  fetchCommunityById(community_id)
  .then((community) => {
    let token = null;
    if(hasToken) {
      token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    }
    res.status(200).send({community, token})
  })
  .catch(next)
}

exports.getCommunityBusinesses = (req, res, next) => {
  const {community_id} = req.params;
  const {user, hasToken} = req;
  fetchCommunityBusinesses(community_id)
  .then((businesses) => {
    let token = null;
    if(hasToken) {
      token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    }
    res.status(200).send({businesses, token})
  })
  .catch(next)
}

exports.getCommunityGroups = (req, res, next) => {
  const {community_id} = req.params;
  const {user, hasToken} = req;

  fetchCommunityGroups(community_id)
  .then((groups) => {
    let token = null;
    if(hasToken) {
      token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    }
    res.status(200).send({groups, token})
  })
  .catch(next)
}

exports.getCommunitySchools = (req, res, next) => {
  const {community_id} = req.params;
  const {user, hasToken} = req;

  fetchCommunitySchools(community_id)
  .then((schools) => {
    let token = null;
    if(hasToken) {
      token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    }
    res.status(200).send({schools, token})
  })
  .catch(next)
}

exports.getCommunityChurches = (req, res, next) => {
  const {community_id} = req.params;
  const {user, hasToken} = req;

  fetchCommunityChurches(community_id)
  .then((churches) => {
    let token = null;
    if(hasToken) {
      token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    }
    res.status(200).send({churches, token})
  })
  .catch(next)
}

exports.postCommunity = (req, res, next) => {
  const {body, user} = req
  const checkCommunity = existingCommunityCheck(body)
  const newCommunity = insertCommunity(body)
  Promise.all([newCommunity, checkCommunity])
  .then((promiseArr) => {
    const community = promiseArr[0]
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).send({newCommunity: community, token})
  })
  .catch(next)
}

exports.patchCommunity = (req, res, next) => {
  const { user_id, community_id } = req.params;
  const {user} = req;
  const { community_name, community_description, community_img } = req.body
  editCommunity(user_id, community_id, community_name, community_description, community_img)
  .then((updatedCommunity) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({community: updatedCommunity, token})
  })
  .catch(next)
}

// Get community admins

exports.getCommunityAdmins = ( req, res, next ) => {
  const { community_id } = req.params;
  const { user } = req;
  fetchCommunityAdmins(user.id, community_id)
  .then((communityAdmins) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({communityAdmins, token});
  })
  .catch(next)
}

// Add new admin

exports.postCommunityAdminById = (req, res, next) => {
  const {body, user} = req;
  addCommunityAdminById(user.id, body)
  .then((admin) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).send({admin, token})
  })
  .catch(next);
}

exports.postNewCommunityAdmin = ( req, res, next ) => {
  const { community_id } = req.params;
  const { user, body } = req;
  addCommunityAdmin(body.user_email, community_id, user.id)
  .then((newAdmin) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).send({msg: "New community admin added", admin: newAdmin, token})
  })
  .catch(next)
}

// Remove admin

exports.deleteCommunityAdmin = ( req, res, next ) => {
  const { community_id, removedAdminId } = req.params;
  const { user } = req;
  removeCommunityAdmin(community_id, user.id, removedAdminId)
  .then((deletedAdmin) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({msg: "Community admin removed", deletedAdmin, token})
  })
  .catch(next)
} 

// Block User & Remove From Community

exports.getCommunityMembers = (req, res, next) => {
  const {community_id} = req.params;
  const {user} = req;
  fetchCommunityMembers(user.id, community_id)
  .then((members) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({members, token})
  })
  .catch(next)
}

exports.getBlockedUsers = (req, res, next) => {
  const {community_id} = req.params;
  const {user} = req;
  fetchBlockedUsers(user.id, community_id)
  .then((blockedUsers) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({blockedUsers, token})
  })
  .catch(next)
}

exports.postBlockedUser = ( req, res, next ) => {
  const {community_id} = req.params;
  const {body, user} = req;
  blockUser(user.id, community_id, body)
  .then((blockedUser) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).send({msg: "User blocked", blockedUser, token})
  })
  .catch(next)
}

exports.deleteBlockedUser = ( req, res, next ) => {
  const {community_id, blockedUserId} = req.params;
  const {user} = req;
  unblockUser(user.id, community_id, blockedUserId)
  .then((unblockedUser) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({msg: "User unblocked", unblockedUser, token})
  })
  .catch(next)
}