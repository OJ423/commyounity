exports.authUserCrudOps = (req, res, next) => {
  const tokenUserId = String(req.user.id);
  const tokenUsername = req.user.username
  let receivedUserId = String(req.params.user_id);
  const receivedUsername = req.body.username;
  if (!req.params.user_id && req.body.user_id) receivedUserId = String(req.body.user_id);
  if(tokenUserId !== receivedUserId) {
    return res.status(403).send({msg:'Forbidden: Your security tokens do not match'})
  }
  else if ( receivedUsername && tokenUsername !== receivedUsername) {
    console.log( receivedUserId !== tokenUserId )
    return res.status(403).send({msg:'Forbidden: Your security tokens do not match'})
  }
  next()
}