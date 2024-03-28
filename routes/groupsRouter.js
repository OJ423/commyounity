const { getGroupById, postCommunityGroup } = require('../controllers/groups.controller')
groupsRouter = require('express').Router()

groupsRouter.get('/:group_id', getGroupById)
groupsRouter.post('/:community_id/:user_id', postCommunityGroup)

module.exports = groupsRouter