const fs = require('fs.promises')

exports.endpointsConvert = () => {
  return fs.readFile(`${__dirname}/../endpoints.json`, 'utf8')
  .then((apiData) => {
    const endpoints = JSON.parse(apiData)
    return endpoints
  })
}