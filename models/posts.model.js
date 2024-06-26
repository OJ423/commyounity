const {db} = require('../db/connection')

exports.fetchPostsForUsers = (user_id, filter = null) => {
  let sqlQuery = `
    SELECT p.*, COALESCE(comment_count, 0) AS comment_count, u.username AS author_name,
      g.group_name, ch.church_name, s.school_name, b.business_name
    FROM posts p
    LEFT JOIN (
        SELECT post_id, COUNT(*) AS comment_count
        FROM comments
        GROUP BY post_id
    ) c ON p.post_id = c.post_id
    LEFT JOIN users u ON p.author = u.user_id
    LEFT JOIN groups g ON p.group_id = g.group_id
    LEFT JOIN churches ch ON p.church_id = ch.church_id
    LEFT JOIN schools s ON p.school_id = s.school_id
    LEFT JOIN businesses b ON p.business_id = b.business_id
  `;

  if(filter === 'groups') {
    sqlQuery += `
      LEFT JOIN group_members gm ON g.group_id = gm.group_id
      WHERE gm.user_id = $1
    `;
  } else if(filter === 'churches') {
    sqlQuery += `
      LEFT JOIN church_members cm ON ch.church_id = cm.church_id
      WHERE cm.user_id = $1
    `;
  } else if (filter === 'schools') {
    sqlQuery += `
      LEFT JOIN school_parents_junction spj ON s.school_id = spj.school_id 
      WHERE spj.user_id = $1
    `;
  } else {
    sqlQuery += `
      LEFT JOIN group_members gm ON g.group_id = gm.group_id
      LEFT JOIN church_members cm ON ch.church_id = cm.church_id
      LEFT JOIN school_parents_junction spj ON s.school_id = spj.school_id
      LEFT JOIN community_members cms ON cms.community_id = b.community_id
      WHERE p.author = $1
      OR gm.user_id = $1
      OR cm.user_id = $1
      OR spj.user_id = $1
      OR cms.user_id = $1
    `;
  }

  return db.query(sqlQuery, [user_id])
  .then(({rows}) => {
    return rows;
  })
};



exports.fetchPostById = (post_id) => {
  return db.query(`
    SELECT * 
    FROM posts
    WHERE post_id = $1;`,
    [post_id])
  .then(({rows}) => {
    return rows
  })
}

exports.fetchPostComments = (post_id) => {
  return db.query(`
    SELECT * 
    FROM comments
    WHERE post_id = $1`, [post_id])
  .then(({rows}) => {
    return rows
  })
}

exports.insertPost = (body) => {
  const {post_title, post_description, post_location, post_img, pdf_link, pdf_title, author, church_id, school_id, business_id, group_id} = body
  return db.query(`
    INSERT INTO posts
    (post_title, post_description, post_location, post_img, pdf_link, pdf_title, author, church_id, school_id, business_id, group_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `, [post_title, post_description, post_location, post_img, pdf_link, pdf_title, author, church_id, school_id, business_id, group_id])
  .then(({rows}) => {
    return rows[0]
  })
}