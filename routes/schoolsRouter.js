const { getSchoolById, postCommunitySchool, patchSchool, removeSchool, postNewSchoolAdmin, deleteSchoolAdmin, getParentAccessRequests, patchParentAccessRequest, postSchoolParent, getSchoolParents, deleteSchoolParent, postParentRequest } = require('../controllers/schools.controller')
const { authMiddleware } = require('../middlewares/authMiddleware')

schoolRouter = require('express').Router()
schoolRouter.get('/:school_id', authMiddleware, getSchoolById)
schoolRouter.post('/new/:community_id', authMiddleware, postCommunitySchool)
schoolRouter.patch('/edit/:school_id', authMiddleware, patchSchool)
schoolRouter.delete('/delete/:school_id', authMiddleware, removeSchool)

// School admin management

schoolRouter.post('/owners/new/:school_id', authMiddleware, postNewSchoolAdmin)
schoolRouter.delete('/owners/remove/:school_id/:removeAdminId', authMiddleware, deleteSchoolAdmin)

// School Parent Requests 
schoolRouter.get('/requests/:school_id', authMiddleware, getParentAccessRequests)
schoolRouter.patch('/requests/status/:school_id', authMiddleware, patchParentAccessRequest)
schoolRouter.post('/access', authMiddleware, postParentRequest)

// School Parent CRUD Direct
schoolRouter.get('/parents/:school_id', authMiddleware, getSchoolParents)
schoolRouter.post('/:school_id/parent/add', authMiddleware, postSchoolParent)
schoolRouter.delete('/:school_id/parent/remove/:parent_id', authMiddleware, deleteSchoolParent)

module.exports = schoolRouter