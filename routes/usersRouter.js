const usersRouter = require('express').Router()
const { getUserAdminProfiles, loginUserByUserName, registerUser, verifyUser, forgotPasswordRequest, updateUserPassword, deleteUser, getUsersMembershipsByUserID, patchUser } = require('../controllers/users.controller')
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
// Get Admin Profiles & User Memberships
usersRouter.get('/manage/:user_id/:community_id', authMiddleware, authUserCrudOps, getUserAdminProfiles)
usersRouter.get('/:user_id/:community_id', authMiddleware, authUserCrudOps, getUsersMembershipsByUserID)
// Delete User
usersRouter.delete('/:user_id', authMiddleware, authUserCrudOps, deleteUser)
// Patch USer
usersRouter.patch('/edit/:user_id', authMiddleware, authUserCrudOps, patchUser)


module.exports = usersRouter