const { getSchoolById, postCommunitySchool } = require('../controllers/schools.controller')

schoolRouter = require('express').Router()

schoolRouter.get('/:school_id', getSchoolById)
schoolRouter.post('/:community_id/:user_id', postCommunitySchool)

module.exports = schoolRouter