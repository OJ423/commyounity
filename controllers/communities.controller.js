const {fetchAllCommunities, fetchCommunityBusinesses, fetchCommunityGroups, fetchCommunitySchools, fetchCommunityChurches} = require('../models/communities.model')

exports.getAllCommunities = (req, res, next) => {
  fetchAllCommunities()
  .then((communities) => {
    res.status(200).send({communities})
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