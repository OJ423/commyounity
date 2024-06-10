const { getChurchById, postCommunityChurch } = require('../controllers/churches.controller')

churchesRouter = require('express').Router()

churchesRouter.get('/:church_id', getChurchById)
churchesRouter.post('/:community_id/:user_id', postCommunityChurch)

module.exports = churchesRouter