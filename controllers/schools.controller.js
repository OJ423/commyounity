const { fetchPostsBySchoolId, fetchSchoolById } = require("../models/schools.models");

exports.getSchoolById = (req, res, next) => {
  const {school_id} = req.params;
  const schoolData = fetchSchoolById(school_id)
  const schoolPosts = fetchPostsBySchoolId(school_id)
  Promise.all([schoolData, schoolPosts])
  .then((schoolArr) => {
    const school = schoolArr[0]
    const posts = schoolArr[1]
    res.status(200).send({school, posts})
  })
  .catch(next)
}