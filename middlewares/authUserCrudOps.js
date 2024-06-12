exports.authUserCrudOps = (req, res, next) => {
  const tokenUserId = String(req.user.id);
  const receivedUserId = String(req.params.user_id || req.body.user_id);

  if(tokenUserId !== receivedUserId) {
    return res.status(403).send({msg:'Forbidden: Your security tokens do not match'})
  }
  next()
}