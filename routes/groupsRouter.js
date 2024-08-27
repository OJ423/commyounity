const { getGroupById, postCommunityGroup, patchGroup, removeGroup, postNewGroupAdmin } = require('../controllers/groups.controller')
const { authMiddleware } = require('../middlewares/authMiddleware')
const { authUserCrudOps } = require('../middlewares/authUserCrudOps')
groupsRouter = require('express').Router()

groupsRouter.get('/:group_id', getGroupById)
groupsRouter.post('/:community_id/:user_id', authMiddleware, authUserCrudOps, postCommunityGroup)
groupsRouter.patch('/edit/:group_id/:user_id', authMiddleware, authUserCrudOps, patchGroup)
groupsRouter.delete('/delete/:group_id/:user_id', authMiddleware, removeGroup )

// Add another group admin

groupsRouter.post('/owners/new/:group_id', authMiddleware, postNewGroupAdmin)

module.exports = groupsRouter