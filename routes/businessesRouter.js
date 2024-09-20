const { getBusinessById, postCommunityBusiness, patchBusiness, removeBusiness, postNewOwner, deleteBusinessOwner } = require('../controllers/businesses.controller')
const { authMiddleware } = require('../middlewares/authMiddleware')
const { authUserCrudOps } = require('../middlewares/authUserCrudOps')

businessesRouter = require('express').Router()

businessesRouter.get('/:business_id', getBusinessById)
businessesRouter.post('/new/:community_id', authMiddleware, postCommunityBusiness)
businessesRouter.patch('/edit/:business_id', authMiddleware, patchBusiness)
businessesRouter.delete('/delete/:business_id', authMiddleware, removeBusiness)

// Manage business owners

businessesRouter.post('/owners/new/:business_id', authMiddleware, postNewOwner)
businessesRouter.delete('/owners/remove/:business_id/:removedOwnerId', authMiddleware, deleteBusinessOwner)

module.exports = businessesRouter