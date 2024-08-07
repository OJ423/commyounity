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


exports.insertCommunityChurch = (community_id, user_id, body) => {
  const {church_name, church_bio, church_email, church_website, church_img} = body
  return db.query(`
    INSERT INTO churches
    (church_name, church_bio, church_email, church_website, church_img, community_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING church_id, church_name, church_bio, church_email, church_website, church_img, community_id
  `, [church_name, church_bio, church_email, church_website, church_img, community_id])
  .then(({rows}) => {
    const church_id = rows[0].church_id
    db.query(`
      INSERT INTO church_owners_junction
      (church_id, user_id)
      VALUES ($1, $2)
      `, [church_id, user_id])
    
    db.query(`
      INSERT INTO church_members
      (church_id, user_id)
      VALUES ($1, $2)
      `, [church_id, user_id])

    return rows[0]
  })
}

exports.editChurch = (user_id, church_id, {church_name = null, church_bio = null, church_email = null, church_website = null, church_img = null}) => {
  return db.query(`
    WITH OwnerCheck AS (
      SELECT 1
      FROM church_owners_junction
      WHERE user_id = $1 AND church_id = $2
    )
    UPDATE churches
    SET
      church_name = COALESCE($3, church_name),
      church_bio = COALESCE($4, church_bio),
      church_email = COALESCE($5, church_email),
      church_website = COALESCE($6, church_website),
      church_img = COALESCE($7, church_img)
    WHERE church_id = $2 AND EXISTS (SELECT 1 FROM OwnerCheck)
    RETURNING *;
  `, [user_id, church_id, church_name, church_bio, church_email, church_website, church_img])
  .then((result) => {
    if (!result.rows.length) return Promise.reject({ msg: "You are not the school owner so cannot make changes", status: 400 })
    return result.rows[0]
  })
}

// DELETE CHURCH

exports.deleteChurch = (church_id, user_id) => {
  return db.query(`
    DELETE FROM churches
    WHERE church_id = $1
    AND EXISTS (
    SELECT 1
    FROM church_owners_junction 
    WHERE church_owners_junction.church_id = $1
    AND church_owners_junction.church_id = $2
    )
    RETURNING *;`, [church_id, user_id])
    .then((result) => {
      if (!result.rows.length) return Promise.reject({ msg: "You are not the church owner so cannot make changes", status: 400 })
      return result.rows[0]
    })
}