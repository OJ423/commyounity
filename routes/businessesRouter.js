const { getBusinessById, postCommunityBusiness, patchBusiness, removeBusiness, postNewOwner } = require('../controllers/businesses.controller')
const { authMiddleware } = require('../middlewares/authMiddleware')
const { authUserCrudOps } = require('../middlewares/authUserCrudOps')

businessesRouter = require('express').Router()

businessesRouter.get('/:business_id', getBusinessById)
businessesRouter.post('/:community_id/:user_id', authMiddleware, authUserCrudOps, postCommunityBusiness)
businessesRouter.patch('/edit/:business_id/:user_id', authMiddleware, authUserCrudOps, patchBusiness)
businessesRouter.delete('/delete/:business_id/:user_id', authMiddleware, removeBusiness)

// Add another business owner

businessesRouter.post('/owners/new/:business_id', authMiddleware, postNewOwner)

module.exports = businessesRouter