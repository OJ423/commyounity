const communitiesRouter = require('express').Router();
const {getAllCommunities, getCommunityBusinesses, getCommunityGroups, getCommunitySchools, getCommunityChurches, postCommunity} = require('../controllers/communities.controller')

communitiesRouter.get('/', getAllCommunities)
communitiesRouter.get('/:community_id/businesses', getCommunityBusinesses)
communitiesRouter.get('/:community_id/groups', getCommunityGroups)
communitiesRouter.get('/:community_id/schools', getCommunitySchools)
communitiesRouter.get('/:community_id/churches', getCommunityChurches)
communitiesRouter.post('/', postCommunity)

module.exports = communitiesRouter