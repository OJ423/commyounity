const { fetchPostsBySchoolId, fetchSchoolById, insertCommunitySchool, editSchool, deleteSchool } = require("../models/schools.models");

exports.getSchoolById = (req, res, next) => {
  const {school_id} = req.params;
  const user_id = req.user.id
  const schoolData = fetchSchoolById(school_id)
  const schoolPosts = fetchPostsBySchoolId(school_id, user_id)
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

exports.patchSchool = (req, res, next) => {
  const {user_id, school_id} = req.params;
  const {body} = req;
  editSchool(user_id, school_id, body)
  .then((school) => {
    res.status(200).send({school})
  })
  .catch(next)
}

// DELETE CHURCH

exports.removeSchool = (req, res, next) => {
  const {school_id, user_id} = req.params;
  deleteSchool(school_id, user_id)
  .then((school) => {
    res.status(200).send({msg: "School successfully deleted", school})
  })
  .catch(next)
}