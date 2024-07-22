const { getSchoolById, postCommunitySchool, patchSchool, removeSchool } = require('../controllers/schools.controller')
const { authMiddleware } = require('../middlewares/authMiddleware')
const { authUserCrudOps } = require('../middlewares/authUserCrudOps')

schoolRouter = require('express').Router()
schoolRouter.get('/:school_id', authMiddleware, getSchoolById)
schoolRouter.post('/:community_id/:user_id', authMiddleware, authUserCrudOps, postCommunitySchool)
schoolRouter.patch('/edit/:school_id/:user_id', authMiddleware, authUserCrudOps, patchSchool)
schoolRouter.delete('/delete/:school_id/:user_id', authMiddleware, removeSchool)

module.exports = schoolRouter