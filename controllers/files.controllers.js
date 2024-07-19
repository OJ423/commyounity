const multer = require("multer")
const { insertFile, deleteOldImg } = require("../models/files.models")

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.uploadImage = (req, res, next) => {
  upload.single('image')(req, res, function(err) {
    if (err) {
      console.error('Error uploading file:', err);
      return res.status(500).send({ err: 'Error uploading file' });
    }
    insertFile(req.file)
    .then((result) => {
      const oldImageUrl = req.body.oldImg;
      if (oldImageUrl) {
        const oldImageKey = oldImageUrl.split('/').pop()
        deleteOldImg(oldImageKey)
      }
      res.status(201).send({imgUrl: `${process.env.AWS_IMG_URL}${result}`})
    }).catch((err) => {
      console.error('Error uploading file:', err);
      res.status(500).send({ err: 'Error uploading file' });
    })
  })
} 