const { getGroupById } = require('../controllers/groups.controller')
groupsRouter = require('express').Router()

groupsRouter.get('/:group_id', getGroupById)

module.exports = groupsRouter