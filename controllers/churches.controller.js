const { fetchPostsByChurchId, fetchChurchById, insertCommunityChurch, editChurch, deleteChurch, addAdditionalChurchAdmin } = require("../models/churches.model");

const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET

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

// DELETE CHURCH

exports.removeChurch = (req, res, next) => {
  const {church_id, user_id} = req.params;
  deleteChurch(church_id, user_id)
  .then((church) => {
    res.status(200).send({msg: "Church successfully deleted", church})
  })
  .catch(next)
}

// Add additional church admin

exports.postNewChurchAdmin = ( req, res, next ) => {
  const { church_id } = req.params;
  const { user, body } = req;
  addAdditionalChurchAdmin(body.user_email, church_id, user.id)
  .then((newAdmin) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).send({msg: "New church admin added", admin: newAdmin, token})
  })
  .catch(next)
} 