const {db} = require('../db/connection')

exports.fetchSchoolById = (school_id) => {
  return db.query(`
    SELECT s.* 
    FROM schools s
    WHERE
      s.school_id = $1;
  `, [school_id])
  .then(({rows}) => {
    return rows[0]
  })
}

exports.fetchPostsBySchoolId = (school_id) => {
  return db.query(`
    SELECT p.*, COALESCE(comment_count, 0) AS comment_count
    FROM posts p
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS comment_count
      FROM comments
      GROUP BY post_id
  ) c ON p.post_id = c.post_id
    WHERE p.school_id = $1;
  `, [school_id])
  .then(({rows}) => {
    return rows
  })
}