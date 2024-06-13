const { fetchPostsByChurchId, fetchChurchById, insertCommunityChurch, editChurch } = require("../models/churches.model");

exports.getChurchById = (req, res, next) => {
  const {church_id} = req.params;
  const churchData = fetchChurchById(church_id)
  const churchPosts = fetchPostsByChurchId(church_id)
  Promise.all([churchData, churchPosts])
  .then((churchArr) => {
    const church = churchArr[0]
    const posts = churchArr[1]
    res.status(200).send({church, posts})
  })
  .catch(next)
}

exports.postCommunityChurch = (req, res, next) => {
  const {community_id, user_id} = req.params;
  const {body} = req
  insertCommunityChurch(community_id, user_id, body)
  .then((newChurch) => {
    res.status(201).send({newChurch})
  })
  .catch(next)
}

exports.patchChurch = (req, res, next) => {
  const {user_id, church_id} = req.params;
  const {body} = req;
  editChurch(user_id, church_id, body)
  .then((church) => {
    res.status(200).send({church})
  })
  .catch(next)
}