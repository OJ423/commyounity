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

exports.insertCommunityGroup = (community_id, user_id, body) => {
  const {group_name, group_bio, group_img} = body
  return db.query(`
    INSERT INTO groups
    (group_name, group_bio, group_img, community_id)
    VALUES ($1, $2, $3, $4)
    RETURNING group_id, group_name, group_bio, group_img, community_id
  `, [group_name, group_bio, group_img, community_id])
  .then(({rows}) => {
    const group_id = rows[0].group_id
    db.query(`
      INSERT INTO group_admins
      (group_id, user_id)
      VALUES ($1, $2)
      `, [group_id, user_id])

    db.query(`
      INSERT INTO group_members
      (group_id, user_id)
      VALUES ($1, $2)
      `, [group_id, user_id])

    return rows[0]
  })
}

exports.editGroup = (user_id, group_id, {group_name = null, group_bio = null, group_img = null}) => {
  return db.query(`
    WITH OwnerCheck AS (
      SELECT 1
      FROM group_admins
      WHERE user_id = $1 AND group_id = $2
    )
    UPDATE groups
    SET
      group_name = COALESCE($3, group_name),
      group_bio = COALESCE($4, group_bio),
      group_img = COALESCE($5, group_img)
    WHERE group_id = $2 AND EXISTS (SELECT 1 FROM OwnerCheck)
    RETURNING *;
  `, [user_id, group_id, group_name, group_bio, group_img])
  .then((result) => {
    if (!result.rows.length) return Promise.reject({ msg: "You are not the group owner so cannot make changes", status: 400 })
    return result.rows[0]
  })
}