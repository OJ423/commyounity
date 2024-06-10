const usersRouter = require('express').Router()
const {getUserByEmail, getUserAdminProfiles, loginUserByUserName, registerUser, verifyUser} = require('../controllers/users.controller')

usersRouter.post('/login', loginUserByUserName)
usersRouter.post('/register', registerUser)
usersRouter.get('/verify-email', verifyUser)
usersRouter.get('/:user_email', getUserByEmail)
usersRouter.get('/:user_id/manage', getUserAdminProfiles)

module.exports = usersRouter