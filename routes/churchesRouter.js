const { getChurchById, postCommunityChurch, patchChurch, removeChurch, postNewChurchAdmin, deleteChurchAdmin } = require('../controllers/churches.controller')
const { authMiddleware } = require('../middlewares/authMiddleware')
const { authUserCrudOps } = require('../middlewares/authUserCrudOps')

churchesRouter = require('express').Router()

churchesRouter.get('/:church_id', authMiddleware, getChurchById)
churchesRouter.post('/:community_id', authMiddleware, postCommunityChurch)
churchesRouter.patch('/edit/:church_id', authMiddleware, patchChurch)
churchesRouter.delete('/delete/:church_id', authMiddleware, removeChurch)

// Church admin management
churchesRouter.post('/owners/new/:church_id', authMiddleware, postNewChurchAdmin)
churchesRouter.delete('/owners/remove/:church_id/:removeAdminId', authMiddleware, deleteChurchAdmin)

module.exports = churchesRouter