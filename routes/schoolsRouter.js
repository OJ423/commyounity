const { getSchoolById, postCommunitySchool, patchSchool, removeSchool, postNewSchoolAdmin } = require('../controllers/schools.controller')
const { authMiddleware } = require('../middlewares/authMiddleware')
const { authUserCrudOps } = require('../middlewares/authUserCrudOps')

schoolRouter = require('express').Router()
schoolRouter.get('/:school_id', authMiddleware, getSchoolById)
schoolRouter.post('/new/:community_id', authMiddleware, postCommunitySchool)
schoolRouter.patch('/edit/:school_id', authMiddleware, patchSchool)
schoolRouter.delete('/delete/:school_id', authMiddleware, removeSchool)

// Add another school admin

schoolRouter.post('/owners/new/:school_id', authMiddleware, postNewSchoolAdmin)

module.exports = schoolRouter