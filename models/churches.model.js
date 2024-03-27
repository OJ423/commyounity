const {db} = require('../db/connection')

exports.fetchChurchById = (church_id) => {
  return db.query(`
    SELECT c.* 
    FROM churches c
    WHERE
      c.church_id = $1;
  `, [church_id])
  .then(({rows}) => {
    return rows[0]
  })
}

exports.fetchPostsByChurchId = (church_id) => {
  return db.query(`
    SELECT p.*, COALESCE(comment_count, 0) AS comment_count
    FROM posts p
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS comment_count
      FROM comments
      GROUP BY post_id
  ) c ON p.post_id = c.post_id
    WHERE p.church_id = $1;
  `, [church_id])
  .then(({rows}) => {
    return rows
  })
}