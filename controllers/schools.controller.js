const { fetchPostsBySchoolId, fetchSchoolById, insertCommunitySchool } = require("../models/schools.models");

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

exports.postCommunitySchool = (req, res, next) => {
  const {community_id, user_id} = req.params;
  const {body} = req
  insertCommunitySchool(community_id, user_id, body)
  .then((newSchool) => {
    res.status(201).send({newSchool})
  })
  .catch(next)
}