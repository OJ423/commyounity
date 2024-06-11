const usersRouter = require('express').Router()
const {getUserByEmail, getUserAdminProfiles, loginUserByUserName, registerUser, verifyUser, forgotPasswordRequest, updateUserPassword, deleteUser} = require('../controllers/users.controller')
const { authDeleteUser } = require('../middlewares/authDeleteUser')
const { authMiddleware } = require('../middlewares/authMiddleware')

usersRouter.post('/login', loginUserByUserName)
usersRouter.post('/register', registerUser)
usersRouter.get('/verify-email', verifyUser)
usersRouter.delete('/:user_id', authMiddleware, authDeleteUser, deleteUser)
usersRouter.post('/forgot-password', forgotPasswordRequest)
usersRouter.post('/update-password', updateUserPassword)
usersRouter.get('/:user_email', getUserByEmail)
usersRouter.get('/:user_id/manage', getUserAdminProfiles)

module.exports = usersRouter