const postsRouter = require('express').Router()
const {getPostsForUser, getPostById, postNewPost, likePost, dislikePost, deletePost} = require('../controllers/posts.controller.js')
const { authMiddleware } = require('../middlewares/authMiddleware.js')

postsRouter.get('/user/:user_id/:community_id', getPostsForUser)
postsRouter.get('/:post_id', getPostById)
postsRouter.post('/', authMiddleware, postNewPost)
// Like/Unlike Posts
postsRouter.patch('/post/like', authMiddleware, likePost)
postsRouter.patch('/post/dislike', authMiddleware, dislikePost)
// Delte Posts
postsRouter.delete('/delete/:post_id/:user_id', authMiddleware, deletePost)

module.exports = postsRouter