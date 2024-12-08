const { fetchBusinessById, fetchPostsByBusinessId, insertCommunityBusiness, editBusiness, deleteBusiness, addAdditionalBusinessOwner, removeBusinessOwner } = require("../models/business.models");
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET


exports.getBusinessById = (req, res, next) => {
  const {business_id} = req.params;
  const {user} = req;
  const businessData = fetchBusinessById(business_id)
  const businessPosts = fetchPostsByBusinessId(business_id)
  Promise.all([businessData, businessPosts])
  .then((businessArr) => {
    const business = businessArr[0]
    const posts = businessArr[1]
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({business, posts, token})
  })
  .catch(next)
}

exports.postCommunityBusiness = (req, res, next) => {
  const {community_id} = req.params;
  const {body, user} = req
  insertCommunityBusiness(community_id, user.id, body)
  .then((newBusiness) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).send({newBusiness, token})
  })
  .catch(next)
}

exports.patchBusiness = (req, res, next) => {
  const {business_id} = req.params;
  const {body, user} = req;
  editBusiness(user.id, business_id, body)
  .then((business) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({business, token})
  })
  .catch(next)
}

// DELETE BUSINESS

exports.removeBusiness = (req, res, next) => {
  const { business_id } = req.params;
  const { user } = req;
  deleteBusiness(business_id, user.id)
  .then((business) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({msg: "Business successfully deleted", business, token})
  })
  .catch(next)
}

// Add new business owner

exports.postNewOwner = ( req, res, next ) => {
  const { business_id } = req.params;
  const { user, body } = req;
  addAdditionalBusinessOwner(body.user_email, business_id, user.id)
  .then((newOwner) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).send({msg: "New business owner added", admin: newOwner, token})
  })
  .catch(next)
} 

// Remove business owner

exports.deleteBusinessOwner = (req, res, next) => {
  const { business_id, removedOwnerId } = req.params;
  const { user } = req;
  removeBusinessOwner(business_id, user.id, removedOwnerId)
  .then((deletedOwner) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({msg: "Business owner removed", deletedOwner, token})
  })
}