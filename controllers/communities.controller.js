const {fetchAllCommunities, fetchCommunityBusinesses, fetchCommunityGroups, fetchCommunitySchools, fetchCommunityChurches, insertCommunity, editCommunity, fetchCommunityById, addCommunityAdmin, blockUser, unblockUser, fetchBlockedUsers, fetchCommunityMembers} = require('../models/communities.model');
const { removeCommunityUser } = require('../models/users.model');
const { existingCommunityCheck } = require('./utils');

const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET

exports.getAllCommunities = (req, res, next) => {
  fetchAllCommunities()
  .then((communities) => {
    res.status(200).send({communities})
  })
  .catch(next)
}

exports.getCommunityById = (req, res, next) => {
  const {community_id} = req.params;
  fetchCommunityById(community_id)
  .then((community) => {
    res.status(200).send({community})
  })
  .catch(next)
}

exports.getCommunityBusinesses = (req, res, next) => {
  const {community_id} = req.params;
  fetchCommunityBusinesses(community_id)
  .then((businesses) => {
    res.status(200).send({businesses})
  })
}

exports.getCommunityGroups = (req, res, next) => {
  const {community_id} = req.params;
  fetchCommunityGroups(community_id)
  .then((groups) => {
    res.status(200).send({groups})
  })
}

exports.getCommunitySchools = (req, res, next) => {
  const {community_id} = req.params;
  fetchCommunitySchools(community_id)
  .then((schools) => {
    res.status(200).send({schools})
  })
}

exports.getCommunityChurches = (req, res, next) => {
  const {community_id} = req.params;
  fetchCommunityChurches(community_id)
  .then((churches) => {
    res.status(200).send({churches})
  })
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

// Add new admin

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
  removeCommunityUser(community_id, user.id, removedAdminId)
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