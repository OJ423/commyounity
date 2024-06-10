const { fetchPostsByChurchId, fetchChurchById, insertCommunityChurch } = require("../models/churches.model");

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