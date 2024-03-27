const {db} = require('../db/connection')

exports.fetchBusinessById = (business_id) => {
  return db.query(`
    SELECT b.* 
    FROM businesses b
    WHERE
      b.business_id = $1;
  `, [business_id])
  .then(({rows}) => {
    return rows[0]
  })
}

exports.fetchPostsByBusinessId = (business_id) => {
  return db.query(`
    SELECT p.*, COALESCE(comment_count, 0) AS comment_count
    FROM posts p
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS comment_count
      FROM comments
      GROUP BY post_id
  ) c ON p.post_id = c.post_id
    WHERE p.business_id = $1;
  `, [business_id])
  .then(({rows}) => {
    return rows
  })
}