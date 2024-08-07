const { getChurchById, postCommunityChurch, patchChurch, removeChurch } = require('../controllers/churches.controller')
const { authMiddleware } = require('../middlewares/authMiddleware')
const { authUserCrudOps } = require('../middlewares/authUserCrudOps')

churchesRouter = require('express').Router()

churchesRouter.get('/:church_id', getChurchById)
churchesRouter.post('/:community_id/:user_id', authMiddleware, authUserCrudOps, postCommunityChurch)
churchesRouter.patch('/edit/:church_id/:user_id', authMiddleware, authUserCrudOps, patchChurch)
churchesRouter.delete('/delete/:church_id/:user_id', authMiddleware, removeChurch)

module.exports = churchesRouter