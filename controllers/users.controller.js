const {fetchUserByEmail, fetchUserAdminProfiles, fetchUserBusinesses, fetchUserGroups} = require('../models/users.model.js')

exports.getUserByEmail = (req, res, next) => {
  const {user_email} = req.params
  fetchUserByEmail(user_email)
  .then((user) => {
    res.status(200).send({user})
  })
  .catch(next)
}

exports.getUserAdminProfiles = (req, res, next) => {
  const {user_id} = req.params
  const schoolChurchOwner = fetchUserAdminProfiles(user_id)
  const businessOwner = fetchUserBusinesses(user_id)
  const userGroups = fetchUserGroups(user_id)
  Promise.all([schoolChurchOwner, businessOwner, userGroups])
  .then((admin) => {
    const schoolChurch = admin[0]
    const businesses = admin[1]
    const userGroups = admin[2]
    res.status(200).send({school: schoolChurch.school, church: schoolChurch.church, community: schoolChurch.community, businesses, groups: userGroups})
  })
  .catch(next)
}