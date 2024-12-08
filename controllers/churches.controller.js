const { fetchPostsByChurchId, fetchChurchById, insertCommunityChurch, editChurch, deleteChurch, addAdditionalChurchAdmin, removeChurchAdmin } = require("../models/churches.model");

const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET

exports.getChurchById = (req, res, next) => {
  const {church_id} = req.params;
  const {user} = req;
  const churchData = fetchChurchById(church_id)
  const churchPosts = fetchPostsByChurchId(church_id)
  Promise.all([churchData, churchPosts])
  .then((churchArr) => {
    const church = churchArr[0]
    const posts = churchArr[1]
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({church, posts, token})
  })
  .catch(next)
}

exports.postCommunityChurch = (req, res, next) => {
  const {community_id} = req.params;
  const {body, user} = req
  insertCommunityChurch(community_id, user.id, body)
  .then((newChurch) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).send({newChurch, token})
  })
  .catch(next)
}

exports.patchChurch = (req, res, next) => {
  const {church_id} = req.params;
  const {body, user} = req;
  editChurch(user.id, church_id, body)
  .then((church) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({church, token})
  })
  .catch(next)
}

// DELETE CHURCH

exports.removeChurch = (req, res, next) => {
  const {church_id} = req.params;
  const {user} = req;
  deleteChurch(church_id, user.id)
  .then((church) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({msg: "Church successfully deleted", church, token})
  })
  .catch(next)
}

// church admin management

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

exports.deleteChurchAdmin = ( req, res, next ) => {
  const { church_id, removeAdminId } = req.params;
  const { user } = req;
  removeChurchAdmin(church_id, user.id, removeAdminId)
  .then((deletedAdmin) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({msg: "Church admin removed", deletedAdmin, token})
  })
  .catch(next)
} 