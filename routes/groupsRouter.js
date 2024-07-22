const { getGroupById, postCommunityGroup, patchGroup, removeGroup } = require('../controllers/groups.controller')
const { authMiddleware } = require('../middlewares/authMiddleware')
const { authUserCrudOps } = require('../middlewares/authUserCrudOps')
groupsRouter = require('express').Router()

groupsRouter.get('/:group_id', getGroupById)
groupsRouter.post('/:community_id/:user_id', authMiddleware, authUserCrudOps, postCommunityGroup)
groupsRouter.patch('/edit/:group_id/:user_id', authMiddleware, authUserCrudOps, patchGroup)
groupsRouter.delete('/delete/:group_id/:user_id', authMiddleware, removeGroup )

module.exports = groupsRouter