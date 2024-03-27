const { getChurchById } = require('../controllers/churches.controller')

churchesRouter = require('express').Router()

churchesRouter.get('/:church_id', getChurchById)

module.exports = churchesRouter