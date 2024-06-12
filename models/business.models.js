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

exports.insertCommunityBusiness = (community_id, user_id, body) => {
  const {business_name, business_bio, business_email, business_website, business_img} = body
  return db.query(`
    INSERT INTO businesses
    (business_name, business_bio, business_email, business_website, business_img, community_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING business_id, business_name, business_bio, business_email, business_website, business_img, community_id
  `, [business_name, business_bio, business_email, business_website, business_img, community_id])
  .then(({rows}) => {
    const business_id = rows[0].business_id
    db.query(`
      INSERT INTO business_owners_junction
      (business_id, user_id)
      VALUES ($1, $2)
      `, [business_id, user_id]);
    
    return rows[0]
  })
}