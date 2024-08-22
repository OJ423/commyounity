const postsRouter = require('express').Router()
const {getPostsForUser, getPostById, postNewPost, likePost, dislikePost, deletePost, patchPost, postComment, patchComment, removeComment} = require('../controllers/posts.controller.js')
const { authMiddleware } = require('../middlewares/authMiddleware.js')

// Get a User's Posts
postsRouter.get('/user/:user_id/:community_id', getPostsForUser)
// Get Post by ID
postsRouter.get('/:post_id', getPostById)
// New Post
postsRouter.post('/', authMiddleware, postNewPost)
// Edit Post
postsRouter.patch('/edit/:post_id', authMiddleware, patchPost)
// Like/Unlike Posts
postsRouter.patch('/post/like', authMiddleware, likePost)
postsRouter.patch('/post/dislike', authMiddleware, dislikePost)
// Delete Posts
postsRouter.delete('/delete/:post_id/:user_id', authMiddleware, deletePost)
// Comments
postsRouter.post('/:post_id/comment/new', authMiddleware, postComment)
postsRouter.patch('/comment/:comment_id', authMiddleware, patchComment)
postsRouter.delete('/comment/delete/:comment_id', authMiddleware, removeComment)

module.exports = postsRouter