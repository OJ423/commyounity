const apiRouter = require('express').Router();
const communitiesRouter = require('./communitiesRouter');
const usersRouter = require('./usersRouter');
const postsRouter = require('./postsRouter.js')
const businessesRouter = require('./businessesRouter.js')
const groupsRouter = require('./groupsRouter.js')
const schoolsRouter = require('./schoolsRouter.js')
const churchesRouter = require('./churchesRouter.js')

apiRouter.use('/communities', communitiesRouter)
apiRouter.use('/users', usersRouter)
apiRouter.use('/posts', postsRouter)
apiRouter.use('/businesses', businessesRouter)
apiRouter.use('/groups', groupsRouter)
apiRouter.use('/schools', schoolsRouter)
apiRouter.use('/churches', churchesRouter)

module.exports = apiRouter
