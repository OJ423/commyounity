const { getBusinessById, postCommunityBusiness, patchBusiness } = require('../controllers/businesses.controller')
const { authMiddleware } = require('../middlewares/authMiddleware')
const { authUserCrudOps } = require('../middlewares/authUserCrudOps')

businessesRouter = require('express').Router()

businessesRouter.get('/:business_id', getBusinessById)
businessesRouter.post('/:community_id/:user_id', authMiddleware, authUserCrudOps, postCommunityBusiness)
businessesRouter.patch('/edit/:business_id/:user_id', authMiddleware, authUserCrudOps, patchBusiness)

module.exports = businessesRouter