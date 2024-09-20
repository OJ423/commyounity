const usersRouter = require('express').Router()
const { getUserAdminProfiles, loginUserByUserName, registerUser, verifyUser, forgotPasswordRequest, updateUserPassword, deleteUser, getUsersMembershipsByUserID, patchUser, joinCommunity, leaveCommunity, joinGroup, leaveGroup, joinChurch, leaveChurch, getAdminUsers } = require('../controllers/users.controller')
const { authUserCrudOps } = require('../middlewares/authUserCrudOps')
const { authMiddleware } = require('../middlewares/authMiddleware')

// Login
usersRouter.post('/login', loginUserByUserName)
// Register Process
usersRouter.post('/register', registerUser)
usersRouter.get('/verify-email', verifyUser)
// Forgot Password Process
usersRouter.post('/forgot-password', forgotPasswordRequest)
usersRouter.post('/update-password', updateUserPassword)
// User Community Membership
usersRouter.post('/community/join', authMiddleware, joinCommunity)
usersRouter.delete('/community/leave/:community_id/:user_id', authMiddleware, leaveCommunity)
// User Group Membership
usersRouter.post('/group/join', authMiddleware, joinGroup)
usersRouter.delete('/group/leave/:group_id/:user_id', authMiddleware, leaveGroup)
// User Church Membership
usersRouter.post('/church/join', authMiddleware, joinChurch)
usersRouter.delete('/church/leave/:church_id/:user_id', authMiddleware, leaveChurch)

// Get Admin Profiles & User Memberships
usersRouter.get('/manage/:user_id/:community_id', authMiddleware, authUserCrudOps, getUserAdminProfiles)
usersRouter.get('/:user_id/:community_id', authMiddleware, authUserCrudOps, getUsersMembershipsByUserID)
// Delete User
usersRouter.delete('/:user_id', authMiddleware, authUserCrudOps, deleteUser)
// Patch USer
usersRouter.patch('/edit/:user_id', authMiddleware, authUserCrudOps, patchUser)

// Get Admin User for Entity
usersRouter.get(`/admin/:type/:entityId`, authMiddleware, getAdminUsers)


module.exports = usersRouter