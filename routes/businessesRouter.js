const { getBusinessById, postCommunityBusiness } = require('../controllers/businesses.controller')
const { authMiddleware } = require('../middlewares/authMiddleware')
const { authUserCrudOps } = require('../middlewares/authUserCrudOps')

businessesRouter = require('express').Router()

businessesRouter.get('/:business_id', getBusinessById)
businessesRouter.post('/:community_id/:user_id', authMiddleware, authUserCrudOps, postCommunityBusiness)

module.exports = businessesRouter