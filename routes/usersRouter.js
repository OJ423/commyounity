const usersRouter = require('express').Router()
const { getUserAdminProfiles, registerUser, verifyUser, deleteUser, getUsersMembershipsByUserID, patchUser, joinCommunity, leaveCommunity, joinGroup, leaveGroup, joinChurch, leaveChurch, getAdminUsers, confirmUserLogin, loginByEmail } = require('../controllers/users.controller')
const { authUserCrudOps } = require('../middlewares/authUserCrudOps')
const { authMiddleware } = require('../middlewares/authMiddleware')

// Login
usersRouter.post('/login', loginByEmail)
usersRouter.get('/login/confirm', confirmUserLogin)
// Register Process
usersRouter.post('/register', registerUser)
usersRouter.get('/verify-email', verifyUser)

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
usersRouter.get('/manage/:community_id', authMiddleware, getUserAdminProfiles)
usersRouter.get('/memberships/:community_id', authMiddleware, getUsersMembershipsByUserID)
// Delete User
usersRouter.delete('/delete/:user_id', authMiddleware, authUserCrudOps, deleteUser)
// Patch User
usersRouter.patch('/edit/:user_id', authMiddleware, authUserCrudOps, patchUser)

// Get Admin User for Entity
usersRouter.get(`/admin/:type/:entityId`, authMiddleware, getAdminUsers)


module.exports = usersRouter