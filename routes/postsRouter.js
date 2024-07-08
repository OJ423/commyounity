const postsRouter = require('express').Router()
const {getPostsForUser, getPostById, postNewPost, likePost, dislikePost} = require('../controllers/posts.controller.js')
const { authMiddleware } = require('../middlewares/authMiddleware.js')

postsRouter.get('/user/:user_id', getPostsForUser)
postsRouter.get('/:post_id', getPostById)
postsRouter.post('/', authMiddleware, postNewPost)
// Like/Unlike Posts
postsRouter.patch('/post/like', authMiddleware, likePost)
postsRouter.patch('/post/dislike', authMiddleware, dislikePost)

module.exports = postsRouter