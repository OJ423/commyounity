const usersRouter = require('express').Router()
const {getUserByEmail, getUserAdminProfiles} = require('../controllers/users.controller')

usersRouter.get('/:user_email', getUserByEmail)
usersRouter.get('/:user_id/manage', getUserAdminProfiles)

module.exports = usersRouter