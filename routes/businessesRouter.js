const { getBusinessById } = require('../controllers/businesses.controller')

businessesRouter = require('express').Router()

businessesRouter.get('/:business_id', getBusinessById)

module.exports = businessesRouter