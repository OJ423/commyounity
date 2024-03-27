const {fetchPostsForUsers, fetchPostById, fetchPostComments} = require('../models/posts.model')

exports.getPostsForUser = (req, res, next) => {
  const {user_id} = req.params;
  const {filter} = req.query;
  fetchPostsForUsers(user_id, filter)
  .then((posts) => {
    res.status(200).send({posts})
  })
  .catch(next)
}

exports.getPostById = (req, res, next) => {
  const {post_id} = req.params;
  const getPostData = fetchPostById(post_id)
  const getCommentData = fetchPostComments(post_id)
  Promise.all([getPostData, getCommentData])
  .then((postData) => {
    const post = postData[0]
    const comments = postData[1]
    res.status(200).send({post, comments})
  })
  .catch(next)
}