const { getGroupById, postCommunityGroup, patchGroup } = require('../controllers/groups.controller')
const { authMiddleware } = require('../middlewares/authMiddleware')
const { authUserCrudOps } = require('../middlewares/authUserCrudOps')
groupsRouter = require('express').Router()

groupsRouter.get('/:group_id', getGroupById)
groupsRouter.post('/:community_id/:user_id', authMiddleware, authUserCrudOps, postCommunityGroup)
groupsRouter.patch('/edit/:group_id/:user_id', authMiddleware, authUserCrudOps, patchGroup)

module.exports = groupsRouter