const { getBusinessById, postCommunityBusiness } = require('../controllers/businesses.controller')

businessesRouter = require('express').Router()

businessesRouter.get('/:business_id', getBusinessById)
businessesRouter.post('/:community_id/:user_id', postCommunityBusiness)

module.exports = businessesRouter