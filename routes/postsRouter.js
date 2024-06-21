const postsRouter = require('express').Router()
const {getPostsForUser, getPostById, postNewPost} = require('../controllers/posts.controller.js')
const { authMiddleware } = require('../middlewares/authMiddleware.js')

postsRouter.get('/user/:user_id', getPostsForUser)
postsRouter.get('/:post_id', getPostById)
postsRouter.post('/', authMiddleware, postNewPost)

module.exports = postsRouter