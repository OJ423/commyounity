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

exports.insertCommunitySchool = (community_id, user_id, body) => {
  const {school_name, school_bio, school_email, school_website, school_phone, school_img} = body
  return db.query(`
    INSERT INTO schools
    (school_name, school_bio, school_email, school_website, school_phone, school_img, community_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING school_id, school_name, school_bio, school_email, school_website, school_phone, school_img, community_id
  `, [school_name, school_bio, school_email, school_website, school_phone, school_img, community_id])
  
  .then(({rows}) => {

    const school_id = rows[0].school_id
    
    db.query(`
      INSERT INTO school_owners_junction
      (school_id, user_id)
      VALUES ($1, $2)`
      , [school_id, user_id])
    
    db.query(`
      INSERT INTO school_parents_junction
      (school_id, user_id)
      VALUES ($1, $2)`
      , [school_id, user_id])

    return rows[0]
  })
}