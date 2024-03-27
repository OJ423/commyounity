const postsRouter = require('express').Router()
const {getPostsForUser, getPostById} = require('../controllers/posts.controller.js')

postsRouter.get('/user/:user_id', getPostsForUser)
postsRouter.get('/:post_id', getPostById)

module.exports = postsRouter