const { db } = require("../db/connection");

exports.fetchPostsForUsers = (user_id, community_id, filter = null) => {
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
    LEFT JOIN groups g ON p.group_id = g.group_id
    LEFT JOIN churches ch ON p.church_id = ch.church_id
    LEFT JOIN schools s ON p.school_id = s.school_id
    LEFT JOIN businesses b ON p.business_id = b.business_id
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
      LEFT JOIN group_members gm ON g.group_id = gm.group_id AND gm.user_id = $1
      LEFT JOIN church_members cm ON ch.church_id = cm.church_id AND cm.user_id = $1
      LEFT JOIN school_parents_junction spj ON s.school_id = spj.school_id AND spj.user_id = $1
      WHERE (
          (p.author = $1) OR
          (gm.user_id IS NOT NULL AND g.community_id = $2) OR
          (cm.user_id IS NOT NULL AND ch.community_id = $2) OR
          (spj.user_id IS NOT NULL AND s.community_id = $2) OR
          (b.community_id = $2)
      )
    `;
  }

  sqlQuery += `
  ORDER BY p.post_date DESC
  `;

  return db.query(sqlQuery, [user_id, community_id]).then(({ rows }) => {
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
    (post_title, post_description, post_location, post_img, web_link, web_title, author, church_id, school_id, business_id, group_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `,
      [
        post_title,
        post_description,
        post_location,
        post_img,
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
      if (rows.length === 0)
        return Promise.reject({
          msg: "You cannot delete this post",
          status: 400,
        });
      else {
        return { msg: "Post successfully deleted", deletedPost: rows };
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
      web_title = COALESCE($8, web_title)
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
      ]
    )
    .then(({rows}) => {
      if (rows.length === 0)
        return Promise.reject({
          msg: "You cannot edit this post",
          status: 400,
        })
      else {
        return rows[0];
      }
    });
};
