const { db } = require("../db/connection");

exports.fetchPostsForUsers = (
  user_id,
  community_id,
  limit = 5,
  filter = null
) => {
  let sqlQuery = `
    SELECT DISTINCT p.*, COALESCE(comment_count, 0) AS comment_count, u.username AS author_name,
      g.group_name, ch.church_name, s.school_name, b.business_name
    FROM posts p
    LEFT JOIN (
        SELECT post_id, COUNT(*) AS comment_count
        FROM comments
        GROUP BY post_id
    ) c ON p.post_id = c.post_id
    LEFT JOIN users u ON p.author = u.user_id
    LEFT JOIN groups g ON p.group_id = g.group_id AND g.community_id = $2
    LEFT JOIN churches ch ON p.church_id = ch.church_id AND ch.community_id = $2
    LEFT JOIN schools s ON p.school_id = s.school_id AND s.community_id = $2
    LEFT JOIN businesses b ON p.business_id = b.business_id AND b.community_id = $2
  `;

  if (filter === "groups") {
    sqlQuery += `
      INNER JOIN group_members gm ON g.group_id = gm.group_id
      WHERE gm.user_id = $1 AND g.community_id = $2
    `;
  } else if (filter === "churches") {
    sqlQuery += `
      INNER JOIN church_members cm ON ch.church_id = cm.church_id
      WHERE cm.user_id = $1 AND ch.community_id = $2
    `;
  } else if (filter === "schools") {
    sqlQuery += `
      INNER JOIN school_parents_junction spj ON s.school_id = spj.school_id 
      WHERE spj.user_id = $1 AND s.community_id = $2
    `;
  } else {
    sqlQuery += `
      LEFT JOIN group_members gm ON g.group_id = gm.group_id AND gm.user_id = $1 AND g.community_id = $2
      LEFT JOIN church_members cm ON ch.church_id = cm.church_id AND cm.user_id = $1 AND ch.community_id = $2
      LEFT JOIN school_parents_junction spj ON s.school_id = spj.school_id AND spj.user_id = $1 AND s.community_id = $2
      LEFT JOIN business_owners_junction boj ON b.business_id = boj.business_id AND boj.user_id = $1 AND b.community_id = $2
      WHERE (
        g.community_id = $2 OR 
        ch.community_id = $2 OR 
        s.community_id = $2 OR 
        b.community_id = $2
      )
      AND (
        (p.author = $1) OR
        (gm.user_id IS NOT NULL) OR
        (cm.user_id IS NOT NULL) OR
        (spj.user_id IS NOT NULL) OR
        (b.business_id IS NOT NULL)
      )
    `;
  }

  sqlQuery += `
  ORDER BY p.post_date DESC
  LIMIT $3
  `;

  return db.query(sqlQuery, [user_id, community_id, limit]).then(({ rows }) => {
    return rows;
  });
};

exports.fetchPostById = (post_id) => {
  return db
    .query(
      `
    SELECT * 
    FROM posts
    WHERE post_id = $1;`,
      [post_id]
    )
    .then(({ rows }) => {
      return rows;
    });
};

exports.fetchPostComments = (post_id) => {
  return db
    .query(
      `
    SELECT comments.*, users.username AS author_name, users.user_avatar
    FROM comments
    JOIN users ON comments.author = users.user_id
    WHERE comments.post_id = $1
    ORDER BY comments.comment_id DESC;`,
      [post_id]
    )
    .then(({ rows }) => {
      return rows;
    });
};

exports.insertPost = (body) => {
  const {
    post_title,
    post_description,
    post_location,
    post_img,
    post_video_url,
    web_link,
    web_title,
    author,
    church_id,
    school_id,
    business_id,
    group_id,
  } = body;
  return db
    .query(
      `
    INSERT INTO posts
    (post_title, post_description, post_location, post_img, post_video_url, web_link, web_title, author, church_id, school_id, business_id, group_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `,
      [
        post_title,
        post_description,
        post_location,
        post_img,
        post_video_url,
        web_link,
        web_title,
        author,
        church_id,
        school_id,
        business_id,
        group_id,
      ]
    )
    .then(({ rows }) => {
      return rows[0];
    });
};

exports.fetchUserPostLikes = (user_id) => {
  return db
    .query(
      `
    SELECT * FROM user_post_likes
    WHERE user_id = $1`,
      [user_id]
    )
    .then(({ rows }) => {
      return rows;
    });
};

exports.patchPostLike = ({ post_id, user_id }) => {
  return db
    .query(
      `
    UPDATE posts
    SET post_likes = post_likes + 1
    WHERE post_id = $1`,
      [post_id]
    )
    .then(() => {
      return db.query(
        `
      INSERT INTO user_post_likes
      (post_id, user_id)
      VALUES ($1, $2)`,
        [post_id, user_id]
      );
    })
    .then(() => {
      return db.query(
        `
      SELECT * FROM user_post_likes
      WHERE user_id = $1`,
        [user_id]
      );
    })
    .then(({ rows }) => {
      return rows;
    });
};

exports.patchPostDislike = ({ post_id, user_id }) => {
  return db
    .query(
      `
    SELECT * FROM user_post_likes
    WHERE user_id = $1 AND post_id = $2`,
      [user_id, post_id]
    )
    .then(({ rows }) => {
      if (rows.length > 0) {
        return db.query(
          `
        UPDATE posts
        SET post_likes = post_likes - 1
        WHERE post_id = $1`,
          [post_id]
        );
      } else if (rows.length === 0) {
        return Promise.reject({
          msg: "You can only remove an existing like",
          status: 400,
        });
      }
    })

    .then(() => {
      return db.query(
        `
      DELETE FROM user_post_likes
      WHERE user_id = $1 AND post_id = $2`,
        [user_id, post_id]
      );
    })
    .then(() => {
      return db.query(
        `
      SELECT * FROM user_post_likes
      WHERE user_id = $1`,
        [user_id]
      );
    })
    .then(({ rows }) => {
      return rows;
    });
};

// Delete post

exports.removePost = (post_id, user_id) => {
  return db
    .query(
      `
    DELETE FROM posts
    WHERE post_id = $1 AND author = $2
    RETURNING *
    `,
      [post_id, user_id]
    )
    .then(({ rows }) => {
      if (rows.length > 0) {
        return Promise.resolve({
          msg: "Post successfully deleted",
          deletedPost: rows,
        });
      } else {
        return db
          .query(`SELECT * FROM posts WHERE post_id = $1`, [post_id])
          .then(({ rows }) => {
            if (rows[0].business_id !== null) {
              return db.query(
                `SELECT * FROM business_owners_junction WHERE user_id = $1 AND business_id = $2`,
                [user_id, rows[0].business_id]
              );
            }
            if (rows[0].church_id !== null) {
              return db.query(
                `SELECT * FROM church_owners_junction WHERE user_id = $1 AND church_id = $2`,
                [user_id, rows[0].church_id]
              );
            }
            if (rows[0].school_id !== null) {
              return db.query(
                `SELECT * FROM school_owners_junction WHERE user_id = $1 AND school_id = $2`,
                [user_id, rows[0].school_id]
              );
            }
            if (rows[0].group_id !== null) {
              return db.query(
                `SELECT * FROM group_admins WHERE user_id = $1 AND group_id = $2`,
                [user_id, rows[0].group_id]
              );
            }
            return Promise.reject({
              msg: "No associated entity found for post",
              status: 400,
            });
          })
          .then(({ rows }) => {
            if (rows.length === 0) {
              return Promise.reject({
                msg: "You cannot edit this post",
                status: 400,
              });
            } else {
              return db.query(
                `
            DELETE FROM posts
            WHERE post_id = $1
            RETURNING *;
          `,
                [post_id]
              );
            }
          })
          .then(({ rows }) => {
            return rows[0];
          });
      }
    });
};

// Edit Post

exports.editPost = (
  post_id,
  user_id,
  {
    post_title = null,
    post_description = null,
    post_location = null,
    post_img = null,
    web_link = null,
    web_title = null,
    post_video_url = null,
  }
) => {
  return db
    .query(
      `
    UPDATE posts
    SET
      post_title = COALESCE($3, post_title),
      post_description = COALESCE($4, post_description),
      post_location = COALESCE($5, post_location),
      post_img = COALESCE($6, post_img),
      web_link = COALESCE($7, web_link),
      web_title = COALESCE($8, web_title),
      post_video_url = COALESCE($9, post_video_url)
    WHERE post_id = $1 AND author = $2
    RETURNING *;
  `,
      [
        post_id,
        user_id,
        post_title,
        post_description,
        post_location,
        post_img,
        web_link,
        web_title,
        post_video_url,
      ]
    )
    .then(({ rows }) => {
      if (rows.length > 0) {
        return Promise.resolve(rows[0]);
      } else {
        return db
          .query(`SELECT * FROM posts WHERE post_id = $1`, [post_id])
          .then(({ rows }) => {
            if (rows[0].business_id !== null) {
              return db.query(
                `SELECT * FROM business_owners_junction WHERE user_id = $1 AND business_id = $2`,
                [user_id, rows[0].business_id]
              );
            }
            if (rows[0].church_id !== null) {
              return db.query(
                `SELECT * FROM church_owners_junction WHERE user_id = $1 AND church_id = $2`,
                [user_id, rows[0].church_id]
              );
            }
            if (rows[0].school_id !== null) {
              return db.query(
                `SELECT * FROM school_owners_junction WHERE user_id = $1 AND school_id = $2`,
                [user_id, rows[0].school_id]
              );
            }
            if (rows[0].group_id !== null) {
              return db.query(
                `SELECT * FROM group_admins WHERE user_id = $1 AND group_id = $2`,
                [user_id, rows[0].group_id]
              );
            }
            return Promise.reject({
              msg: "No associated entity found for post",
              status: 400,
            });
          })
          .then(({ rows }) => {
            if (rows.length === 0) {
              return Promise.reject({
                msg: "You cannot edit this post",
                status: 400,
              });
            } else {
              return db.query(
                `
            UPDATE posts
            SET
              post_title = COALESCE($2, post_title),
              post_description = COALESCE($3, post_description),
              post_location = COALESCE($4, post_location),
              post_img = COALESCE($5, post_img),
              web_link = COALESCE($6, web_link),
              web_title = COALESCE($7, web_title),
              post_video_url = COALESCE($8, post_video_url)
            WHERE post_id = $1
            RETURNING *;
          `,
                [
                  post_id,
                  post_title,
                  post_description,
                  post_location,
                  post_img,
                  web_link,
                  web_title,
                  post_video_url,
                ]
              );
            }
          })
          .then(({ rows }) => {
            return rows[0];
          });
      }
    });
};

// Add a new comment to a post

exports.newComment = (post_id, user_id, comment) => {
  const { comment_title, comment_body, comment_ref } = comment;
  return db
    .query(
      `
    INSERT INTO comments 
    (comment_title, comment_body, author, post_id, comment_ref)
    VALUES
    ($1, $2, $3, $4, $5)
    RETURNING *
    `,
      [comment_title, comment_body, user_id, post_id, comment_ref]
    )
    .then(({ rows }) => {
      if (rows.length === 0) {
        return Promise.reject({
          msg: "You cannot edit this post",
          status: 400,
        });
      }
      return rows[0];
    });
};

exports.editComment = (comment_id, user_id, comment) => {
  return db
    .query(
      `
    UPDATE comments
    SET
      comment_title = COALESCE($1, comment_title),
      comment_body = COALESCE($2, comment_body)
    WHERE comment_id = $3 AND author = $4
    RETURNING *;
    `,
      [comment.comment_title, comment.comment_body, comment_id, user_id]
    )
    .then(({ rows }) => {
      if (rows.length === 0) {
        return Promise.reject({
          msg: "You cannot edit this comment",
          status: 400,
        });
      } else {
        return rows[0];
      }
    });
};

exports.deleteComment = (comment_id, user_id) => {
  return db
    .query(
      `
    DELETE FROM comments
    WHERE comment_id = $1 AND author = $2
    RETURNING *
    `,
      [comment_id, user_id]
    )
    .then(({ rows }) => {
      if (rows.length === 0) {
        return Promise.reject({
          msg: "You cannot delete this comment",
          status: 400,
        });
      } else {
        return rows[0];
      }
    });
};
