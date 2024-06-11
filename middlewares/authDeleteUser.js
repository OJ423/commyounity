exports.authDeleteUser = (req, res, next) => {
  const tokenUserId = String(req.user.id);
  const tokenUsername = req.user.username
  const receivedUserId = String(req.params.user_id);
  const receivedUsername = req.body.username;
  if(tokenUserId !== receivedUserId) {
    console.log(receivedUsername !== tokenUsername)
    return res.status(403).send({msg:'Forbidden: You are not allowed to delete this account'})
  }
  else if ( tokenUsername !== receivedUsername) {
    console.log( receivedUserId !== tokenUserId )
    return res.status(403).send({msg:'Forbidden: You are not allowed to delete this account'})
  }
  next()
}