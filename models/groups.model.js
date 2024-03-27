const {db} = require('../db/connection')

exports.fetchGroupById = (group_id) => {
  return db.query(`
    SELECT g.* 
    FROM groups g
    WHERE
      g.group_id = $1;
  `, [group_id])
  .then(({rows}) => {
    return rows[0]
  })
}

exports.fetchPostsByGroupId = (group_id) => {
  return db.query(`
    SELECT p.*, COALESCE(comment_count, 0) AS comment_count
    FROM posts p
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS comment_count
      FROM comments
      GROUP BY post_id
  ) c ON p.post_id = c.post_id
    WHERE p.group_id = $1;
  `, [group_id])
  .then(({rows}) => {
    return rows
  })
}