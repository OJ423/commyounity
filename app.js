const express = require("express")
const apiRouter = require('./routes/api-router')
const {applicationErrors, customErrors, psqlErrors} = require("./errors/error-handling")
const cors = require('cors');

const app = express()
app.use(cors());
app.use(express.json())

app.use('/api', apiRouter)

app.use(customErrors)
app.use(psqlErrors)
app.use(applicationErrors)

module.exports = app