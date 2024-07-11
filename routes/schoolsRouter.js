const { getSchoolById, postCommunitySchool, patchSchool } = require('../controllers/schools.controller')
const { authMiddleware } = require('../middlewares/authMiddleware')
const { authUserCrudOps } = require('../middlewares/authUserCrudOps')

schoolRouter = require('express').Router()
schoolRouter.get('/:school_id', authMiddleware, getSchoolById)
schoolRouter.post('/:community_id/:user_id', authMiddleware, authUserCrudOps, postCommunitySchool)
schoolRouter.patch('/edit/:school_id/:user_id', authMiddleware, authUserCrudOps, patchSchool)

module.exports = schoolRouter