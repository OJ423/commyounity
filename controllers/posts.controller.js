const {fetchPostsForUsers, fetchPostById, fetchPostComments, insertPost, patchPostLike, patchPostDislike} = require('../models/posts.model')

exports.getPostsForUser = (req, res, next) => {
  const {user_id, community_id} = req.params;
  const {filter} = req.query;
  fetchPostsForUsers(user_id, community_id, filter)
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

exports.postNewPost = (req, res, next) => {
  const {body} = req;
  insertPost(body)
  .then((post) => {
    res.status(201).send({newPost: post})
  })
  .catch(next)
}

exports.likePost = (req, res, next) => {
  const {body} = req;
  patchPostLike(body)
  .then((postLikes) => {
    res.status(200).send({postLikes})
  })
  .catch(next)
}

exports.dislikePost = (req, res, next) => {
  const {body} = req;
  patchPostDislike(body)
  .then((postLikes) => {
    res.status(200).send({postLikes})
  })
  .catch(next)
}