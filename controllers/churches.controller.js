const { fetchPostsByChurchId, fetchChurchById } = require("../models/churches.model");

exports.getChurchById = (req, res, next) => {
  const {church_id} = req.params;
  const churchData = fetchChurchById(church_id)
  const churchPosts = fetchPostsByChurchId(church_id)
  Promise.all([churchData, churchPosts])
  .then((churchArr) => {
    const church = churchArr[0]
    const posts = churchArr[1]
    console.log({church, posts})
    res.status(200).send({church, posts})
  })
  .catch(next)
}