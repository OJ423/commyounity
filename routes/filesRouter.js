const { uploadImage } = require("../controllers/files.controllers");
const { authMiddleware } = require("../middlewares/authMiddleware");

const filesRouter = require("express").Router();

filesRouter.post('/upload', authMiddleware, uploadImage);

module.exports = filesRouter;
