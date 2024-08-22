const { db } = require("../db/connection");

exports.fetchBusinessById = (business_id) => {
  return db
    .query(
      `
    SELECT b.* 
    FROM businesses b
    WHERE
      b.business_id = $1;
  `,
      [business_id]
    )
    .then(({ rows }) => {
      return rows[0];
    });
};

exports.fetchPostsByBusinessId = (business_id) => {
  return db
    .query(
      `
    SELECT p.*, COALESCE(comment_count, 0) AS comment_count, b.business_name AS name
    FROM posts p
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS comment_count
      FROM comments
      GROUP BY post_id
    ) c ON p.post_id = c.post_id
    JOIN businesses b ON p.business_id = b.business_id
    WHERE p.business_id = $1
    ORDER BY p.post_id DESC;
  `,
      [business_id]
    )
    .then(({ rows }) => {
      return rows;
    });
};

exports.insertCommunityBusiness = (community_id, user_id, body) => {
  const {
    business_name,
    business_bio,
    business_email,
    business_website,
    business_img,
  } = body;
  return db
    .query(
      `
    INSERT INTO businesses
    (business_name, business_bio, business_email, business_website, business_img, community_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING business_id, business_name, business_bio, business_email, business_website, business_img, community_id
  `,
      [
        business_name,
        business_bio,
        business_email,
        business_website,
        business_img,
        community_id,
      ]
    )
    .then(({ rows }) => {
      const business_id = rows[0].business_id;
      db.query(
        `
      INSERT INTO business_owners_junction
      (business_id, user_id)
      VALUES ($1, $2)
      `,
        [business_id, user_id]
      );

      return rows[0];
    });
};

exports.editBusiness = (
  user_id,
  business_id,
  {
    business_name = null,
    business_bio = null,
    business_email = null,
    business_website = null,
    business_img = null,
  }
) => {
  return db
    .query(
      `
    WITH OwnerCheck AS (
      SELECT 1
      FROM business_owners_junction
      WHERE user_id = $1 AND business_id = $2
    )
    UPDATE businesses
    SET
      business_name = COALESCE($3, business_name),
      business_bio = COALESCE($4, business_bio),
      business_email = COALESCE($5, business_email),
      business_website = COALESCE($6, business_website),
      business_img = COALESCE($7, business_img)
    WHERE business_id = $2 AND EXISTS (SELECT 1 FROM OwnerCheck)
    RETURNING *;
  `,
      [
        user_id,
        business_id,
        business_name,
        business_bio,
        business_email,
        business_website,
        business_img,
      ]
    )
    .then((result) => {
      if (!result.rows.length)
        return Promise.reject({
          msg: "You are not the business owner so cannot make changes",
          status: 400,
        });
      return result.rows[0];
    });
};

// DELETE BUSINESS

exports.deleteBusiness = (business_id, user_id) => {
  return db
    .query(
      `
    DELETE FROM businesses
    WHERE business_id = $1
    AND EXISTS (
    SELECT 1
    FROM business_owners_junction 
    WHERE business_owners_junction.business_id = $1
    AND business_owners_junction.user_id = $2
    )
    RETURNING *;`,
      [business_id, user_id]
    )
    .then((result) => {
      if (!result.rows.length)
        return Promise.reject({
          msg: "You are not the church owner so cannot make changes",
          status: 400,
        });
      return result.rows[0];
    });
};

// Add new business owner

exports.addAdditionalBusinessOwner = (email, business_id, user_id) => {
  return db.query(`
    INSERT INTO business_owners_junction (business_id, user_id)
    SELECT b.business_id, u.user_id
    FROM businesses b
    JOIN users u ON u.user_email = $1
    JOIN business_owners_junction bo ON bo.business_id = b.business_id
    WHERE b.business_id = $2 AND bo.user_id = $3
      AND NOT EXISTS (
        SELECT 1 FROM business_owners_junction
        WHERE business_id = b.business_id AND user_id = u.user_id
      )
    RETURNING *;
    `, [email, business_id, user_id])
  .then(({ rows }) => {
    if (rows.length === 0) {
      return Promise.reject({
        msg: "The user email supplied does not exist",
        status: 400
      })
    }
    return rows[0]
  })
};
