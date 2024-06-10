const postsRouter = require('express').Router()
const {getPostsForUser, getPostById, postNewPost} = require('../controllers/posts.controller.js')

postsRouter.get('/user/:user_id', getPostsForUser)
postsRouter.get('/:post_id', getPostById)
postsRouter.post('/', postNewPost)

module.exports = postsRouter