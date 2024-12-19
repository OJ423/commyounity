const { fetchGroupById, fetchPostsByGroupId, insertCommunityGroup, editGroup, deleteGroup, addAdditionalGroupAdmin, removeGroupAdmin } = require("../models/groups.model");

const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET

exports.getGroupById = (req, res, next) => {
  const {group_id} = req.params;
  const {user} = req;
  const groupData = fetchGroupById(group_id)
  const groupPosts = fetchPostsByGroupId(group_id)
  Promise.all([groupData, groupPosts])
  .then((groupArr) => {
    const group = groupArr[0]
    const posts = groupArr[1]
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({group, posts, token})
  })
  .catch(next)
}

exports.postCommunityGroup = (req, res, next) => {
  const {community_id, user_id} = req.params;
  const {body} = req
  insertCommunityGroup(community_id, user_id, body)
  .then((newGroup) => {
    res.status(201).send({newGroup})
  })
  .catch(next)
}

exports.patchGroup = (req, res, next) => {
  const {user_id, group_id} = req.params;
  const {body} = req;
  editGroup(user_id, group_id, body)
  .then((group) => {
    res.status(200).send({group})
  })
  .catch(next)
}

// DELETE GROUP

exports.removeGroup = (req, res, next) => {
  const {group_id, user_id} = req.params;
  const {user} = req;
  deleteGroup(group_id, user_id)
  .then((group) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({msg: "Group successfully deleted", group, token})
  })
  .catch(next)
}

// Add additional group admin

exports.postNewGroupAdmin = ( req, res, next ) => {
  const { group_id } = req.params;
  const { user, body } = req;
  addAdditionalGroupAdmin(body.user_email, group_id, user.id)
  .then((newAdmin) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).send({msg: "New group admin added", admin: newAdmin, token})
  })
  .catch(next)
}

exports.deleteGroupAdmin = ( req, res, next ) => {
  const { group_id, removedAdminId } = req.params;
  const { user } = req;
  removeGroupAdmin(group_id, user.id, removedAdminId)
  .then((deletedAdmin) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({msg: "Group admin removed", deletedAdmin, token})
  })
  .catch(next)
} 