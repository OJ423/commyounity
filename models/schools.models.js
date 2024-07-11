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

exports.fetchPostsBySchoolId = (school_id, user_id) => {
  return db.query(`
    WITH ParentCheck AS (
      SELECT 1
      FROM school_parents_junction
      WHERE user_id = $2 AND school_id = $1
    )
    SELECT p.*, COALESCE(comment_count, 0) AS comment_count
    FROM posts p
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS comment_count
      FROM comments
      GROUP BY post_id
  ) c ON p.post_id = c.post_id
    WHERE p.school_id = $1 AND EXISTS (SELECT 1 FROM ParentCheck);
  `, [school_id, user_id])
  .then(({rows}) => {
    if(!rows.length) return Promise.reject({status: 400, msg:"You need to be a school parent/guardian to see school posts"})
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

exports.editSchool = (user_id, school_id, {school_name = null, school_bio = null, school_email = null, school_website = null, school_phone = null, school_img = null}) => {
  return db.query(`
    WITH OwnerCheck AS (
      SELECT 1
      FROM school_owners_junction
      WHERE user_id = $1 AND school_id = $2
    )
    UPDATE schools
    SET
      school_name = COALESCE($3, school_name),
      school_bio = COALESCE($4, school_bio),
      school_email = COALESCE($5, school_email),
      school_website = COALESCE($6, school_website),
      school_phone = COALESCE($7, school_phone),
      school_img = COALESCE($8, school_img)
    WHERE school_id = $2 AND EXISTS (SELECT 1 FROM OwnerCheck)
    RETURNING *;
  `, [user_id, school_id, school_name, school_bio, school_email, school_website, school_phone, school_img])
  .then((result) => {
    if (!result.rows.length) return Promise.reject({ msg: "You are not the school owner so cannot make changes", status: 400 })
    return result.rows[0]
  })
}