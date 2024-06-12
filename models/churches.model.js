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