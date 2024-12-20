const {fetchPostsForUsers, fetchPostById, fetchPostComments, insertPost, patchPostLike, patchPostDislike, removePost, editPost, newComment, editComment, deleteComment, fetchUserPostLikes} = require('../models/posts.model')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET

exports.getPostsForUser = (req, res, next) => {
  const {community_id} = req.params;
  const {user} = req;
  const {filter, limit} = req.query;
  fetchPostsForUsers(user.id, community_id, limit, filter)
  .then((posts) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({posts, token})
  })
  .catch(next)
}

exports.getPostById = (req, res, next) => {
  const {post_id} = req.params;
  const {user} = req;
  const getPostData = fetchPostById(post_id)
  const getCommentData = fetchPostComments(post_id)
  Promise.all([getPostData, getCommentData])
  .then((postData) => {
    const post = postData[0]
    const comments = postData[1]
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({post, comments, token})
  })
  .catch(next)
}

exports.postNewPost = (req, res, next) => {
  const {body, user} = req;
  insertPost(body)
  .then((post) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).send({newPost: post, token})
  })
  .catch(next)
}

exports.getUserPostLikes = (req, res, next) => {
  const {user} = req;
  fetchUserPostLikes(user.id)
  .then((userPostLikes) => {
    res.status(200).send({userPostLikes})
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

// Delete post

exports.deletePost = (req, res, next) => {
  const { post_id } = req.params;
  const { user } = req
  removePost( post_id, user.id )
  .then((deleteRequest) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({ msg: deleteRequest.msg, postDeleted: deleteRequest.deletedPost, token })
  })
  .catch(next)
}

// Edit Post

exports.patchPost = (req, res, next) => {
  const { post_id } = req.params;
  const { user, body } = req;
  editPost( post_id, user.id, body )
  .then((post) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({post, token})
  })
  .catch(next)
}

// New Comment

exports.postComment = ( req, res, next ) => {
  const { post_id } = req.params;
  const { user, body } = req;
  newComment( post_id, user.id, body )
  .then((newComment) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).send({comment: newComment, token})
  })
  .catch(next)
}

// Edit Comment

exports.patchComment = ( req, res, next ) => {
  const { comment_id } = req.params;
  const { user, body } = req;
  editComment( comment_id, user.id, body )
  .then((comment) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({ comment, token })
  })
  .catch(next)
}

// Delete Comment

exports.removeComment = ( req, res, next ) => {
  const { comment_id, post_id } = req.params;
  const { user } = req;
  deleteComment( comment_id, post_id, user.id )
  .then((comment) => {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).send({ msg: "Successfully deleted", comment, token })
  })
  .catch(next)
} 