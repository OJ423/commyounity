const { endpointsConvert } = require("../models/endpoints.model")


exports.endpointsJSON = (req, res, next) => {
  endpointsConvert()
  .then((endpoints) => {
    res.status(200).send({endpoints})
  })
  .catch(next)
}