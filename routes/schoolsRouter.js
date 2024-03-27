const { getSchoolById } = require('../controllers/schools.controller')

schoolRouter = require('express').Router()

schoolRouter.get('/:school_id', getSchoolById)

module.exports = schoolRouter