const { fetchPostsBySchoolId, fetchSchoolById, insertCommunitySchool, editSchool, deleteSchool, addAdditionalSchoolAdmin } = require("../models/schools.models");

const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET


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
  const {community_id} = req.params;
  const {body, user} = req
  insertCommunitySchool(community_id, user.id, body)
  .then((newSchool) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).send({newSchool, token})
  })
  .catch(next)
}

exports.patchSchool = (req, res, next) => {
  const {school_id} = req.params;
  const {body, user} = req;
  editSchool(user.id, school_id, body)
  .then((school) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({school, token})
  })
  .catch(next)
}

// DELETE SCHOOL

exports.removeSchool = (req, res, next) => {
  const {school_id} = req.params;
  const {user} = req;
  deleteSchool(school_id, user.id)
  .then((school) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({msg: "School successfully deleted", school, token})
  })
  .catch(next)
}

// Add additional school admin

exports.postNewSchoolAdmin = ( req, res, next ) => {
  const { school_id } = req.params;
  const { user, body } = req;
  addAdditionalSchoolAdmin(body.user_email, school_id, user.id)
  .then((newAdmin) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).send({msg: "New school admin added", admin: newAdmin, token})
  })
  .catch(next)
} 