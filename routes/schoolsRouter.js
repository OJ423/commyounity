const { getSchoolById, postCommunitySchool, patchSchool, removeSchool, postNewSchoolAdmin, deleteSchoolAdmin, getParentAccessRequests, patchParentAccessRequest } = require('../controllers/schools.controller')
const { authMiddleware } = require('../middlewares/authMiddleware')
const { authUserCrudOps } = require('../middlewares/authUserCrudOps')

schoolRouter = require('express').Router()
schoolRouter.get('/:school_id', authMiddleware, getSchoolById)
schoolRouter.post('/new/:community_id', authMiddleware, postCommunitySchool)
schoolRouter.patch('/edit/:school_id', authMiddleware, patchSchool)
schoolRouter.delete('/delete/:school_id', authMiddleware, removeSchool)

// School admin management

schoolRouter.post('/owners/new/:school_id', authMiddleware, postNewSchoolAdmin)
schoolRouter.delete('/owners/remove/:school_id/:removeAdminId', authMiddleware, deleteSchoolAdmin)

// School Parent Access
schoolRouter.get('/requests/:school_id', authMiddleware, getParentAccessRequests)
schoolRouter.patch('/requests/status/:school_id', authMiddleware, patchParentAccessRequest)

module.exports = schoolRouter