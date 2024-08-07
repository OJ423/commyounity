const { fetchBusinessById, fetchPostsByBusinessId, insertCommunityBusiness, editBusiness, deleteBusiness } = require("../models/business.models");

exports.getBusinessById = (req, res, next) => {
  const {business_id} = req.params;
  const businessData = fetchBusinessById(business_id)
  const businessPosts = fetchPostsByBusinessId(business_id)
  Promise.all([businessData, businessPosts])
  .then((businessArr) => {
    const business = businessArr[0]
    const posts = businessArr[1]
    res.status(200).send({business, posts})
  })
  .catch(next)
}

exports.postCommunityBusiness = (req, res, next) => {
  const {community_id, user_id} = req.params;
  const {body} = req
  insertCommunityBusiness(community_id, user_id, body)
  .then((newBusiness) => {
    res.status(201).send({newBusiness})
  })
  .catch(next)
}

exports.patchBusiness = (req, res, next) => {
  const {user_id, business_id} = req.params;
  const {body} = req;
  editBusiness(user_id, business_id, body)
  .then((business) => {
    res.status(200).send({business})
  })
  .catch(next)
}

// DELETE BUSINESS

exports.removeBusiness = (req, res, next) => {
  const {business_id, user_id} = req.params;
  deleteBusiness(business_id, user_id)
  .then((business) => {
    res.status(200).send({msg: "Business successfully deleted", business})
  })
  .catch(next)
}