const { fetchGroupById, fetchPostsByGroupId, insertCommunityGroup, editGroup, deleteGroup } = require("../models/groups.model");

exports.getGroupById = (req, res, next) => {
  const {group_id} = req.params;
  const groupData = fetchGroupById(group_id)
  const groupPosts = fetchPostsByGroupId(group_id)
  Promise.all([groupData, groupPosts])
  .then((groupArr) => {
    const group = groupArr[0]
    const posts = groupArr[1]
    res.status(200).send({group, posts})
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
  deleteGroup(group_id, user_id)
  .then((group) => {
    res.status(200).send({msg: "Group successfully deleted", group})
  })
  .catch(next)
}