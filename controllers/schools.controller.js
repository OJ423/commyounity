const { fetchPostsBySchoolId, fetchSchoolById, insertCommunitySchool, editSchool, deleteSchool, addAdditionalSchoolAdmin, removeSchoolAdmin, fetchParentAccessRequests, editParentAccess, fetchUserEmail, insertSchoolParent, fetchSchoolParents, removeSchoolParent, insertParentRequest } = require("../models/schools.models");

const jwt = require('jsonwebtoken');
const { sendSchoolParentRejection, sendSchoolParentApproved } = require("./utils");

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

exports.deleteSchoolAdmin = ( req, res, next ) => {
  const { school_id, removeAdminId } = req.params;
  const { user } = req;
  removeSchoolAdmin(school_id, user.id, removeAdminId)
  .then((deletedAdmin) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({msg: "School admin removed", deletedAdmin, token})
  })
  .catch(next)
} 

// School Parent Access PRocesses

exports.getParentAccessRequests = ( req, res, next ) => {
  const {school_id} = req.params;
  const {user} = req;
  fetchParentAccessRequests(user.id, school_id)
  .then((parentAccessRequests) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({parentAccessRequests, token})
  })
  .catch(next)
}

exports.patchParentAccessRequest = ( req, res, next ) => {
  const {school_id} = req.params;
  const {body, user} = req;
  const parentAccessArr = editParentAccess(user.id, school_id, body);
  const parentEmail = fetchUserEmail(body.parent_access_request_id)
  Promise.all([parentAccessArr, parentEmail])
  .then((promiseArr) => {
    const parentRequest = promiseArr[0][0];
    const parentJunction = promiseArr[0][1];
    const {user_email, username} = promiseArr[1]
    if(body.status === "Rejected") {
      sendSchoolParentRejection(user_email, username)
    }
    if(body.status === "Approved") {
      sendSchoolParentApproved(user_email, username)
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({parentRequest, parentJunction, token})
  })
  .catch(next)
} 

exports.postSchoolParent = ( req, res, next ) => {
  const {school_id} = req.params;
  const {body, user} = req;
  insertSchoolParent(user.id, school_id, body)
  .then((parent) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).send({msg: "Parent added", parent, token})
  })
  .catch(next)
}

exports.deleteSchoolParent = ( req, res, next ) => {
  const {school_id, parent_id} = req.params;
  const {user} = req;
  removeSchoolParent(user.id, school_id, parent_id)
  .then((deletedParent) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({msg: "Parent deleted", deletedParent})
  })
  .catch(next)
}

exports.getSchoolParents = ( req, res, next ) => {
  const {school_id} = req.params;
  const {user} = req;
  fetchSchoolParents(user.id, school_id)
  .then((parents) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({parents, token})
  })
  .catch(next)
}

exports.postParentRequest = ( req, res, next) => {
  const {body, user} = req;
  insertParentRequest(user.id, body)
  .then((parentRequest) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).send({parentRequest, token})
  })
  .catch(next)
}