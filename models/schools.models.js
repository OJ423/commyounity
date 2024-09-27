const { db } = require("../db/connection");

exports.fetchSchoolById = (school_id) => {
  return db
    .query(
      `
    SELECT s.* 
    FROM schools s
    WHERE
      s.school_id = $1;
  `,
      [school_id]
    )
    .then(({ rows }) => {
      return rows[0];
    });
};

exports.fetchPostsBySchoolId = (school_id, user_id) => {
  return db
    .query(
      `
    WITH ParentCheck AS (
      SELECT 1
      FROM school_parents_junction
      WHERE user_id = $2 AND school_id = $1
    )
    SELECT p.*, COALESCE(comment_count, 0) AS comment_count, s.school_name AS name
    FROM posts p
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS comment_count
      FROM comments
      GROUP BY post_id
    ) c ON p.post_id = c.post_id
    JOIN schools s ON p.school_id = s.school_id
    WHERE p.school_id = $1 AND EXISTS (SELECT 1 FROM ParentCheck) 
    ORDER BY p.post_id DESC;
  `,
      [school_id, user_id]
    )
    .then(({ rows }) => {
      if (!rows.length)
        return Promise.reject({
          status: 400,
          msg: "You need to be a school parent/guardian to see school posts",
        });
      return rows;
    });
};

exports.insertCommunitySchool = (community_id, user_id, body) => {
  const {
    school_name,
    school_bio,
    school_email,
    school_website,
    school_phone,
    school_img,
  } = body;
  return db
    .query(
      `
    INSERT INTO schools
    (school_name, school_bio, school_email, school_website, school_phone, school_img, community_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING school_id, school_name, school_bio, school_email, school_website, school_phone, school_img, community_id
  `,
      [
        school_name,
        school_bio,
        school_email,
        school_website,
        school_phone,
        school_img,
        community_id,
      ]
    )

    .then(({ rows }) => {
      const school_id = rows[0].school_id;

      db.query(
        `
      INSERT INTO school_owners_junction
      (school_id, user_id)
      VALUES ($1, $2)`,
        [school_id, user_id]
      );

      db.query(
        `
      INSERT INTO school_parents_junction
      (school_id, user_id)
      VALUES ($1, $2)`,
        [school_id, user_id]
      );

      return rows[0];
    });
};

exports.editSchool = (
  user_id,
  school_id,
  {
    school_name = null,
    school_bio = null,
    school_email = null,
    school_website = null,
    school_phone = null,
    school_img = null,
  }
) => {
  return db
    .query(
      `
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
  `,
      [
        user_id,
        school_id,
        school_name,
        school_bio,
        school_email,
        school_website,
        school_phone,
        school_img,
      ]
    )
    .then((result) => {
      if (!result.rows.length)
        return Promise.reject({
          msg: "You are not the school owner so cannot make changes",
          status: 400,
        });
      return result.rows[0];
    });
};

// DELETE CHURCH

exports.deleteSchool = (school_id, user_id) => {
  return db
    .query(
      `
    DELETE FROM schools
    WHERE school_id = $1
    AND EXISTS (
    SELECT 1
    FROM school_owners_junction 
    WHERE school_owners_junction.school_id = $1
    AND school_owners_junction.user_id = $2
    )
    RETURNING *;`,
      [school_id, user_id]
    )
    .then((result) => {
      if (!result.rows.length)
        return Promise.reject({
          msg: "You are not the school owner so cannot make changes",
          status: 400,
        });
      return result.rows[0];
    });
};

// Add new school admin

exports.addAdditionalSchoolAdmin = (email, school_id, user_id) => {
  return db
    .query(
      `
    INSERT INTO school_owners_junction (school_id, user_id)
    SELECT s.school_id, u.user_id
    FROM schools s
    JOIN users u ON u.user_email = $1
    JOIN school_owners_junction soj ON soj.school_id = s.school_id
    WHERE s.school_id = $2 AND soj.user_id = $3
      AND NOT EXISTS (
        SELECT 1 FROM school_owners_junction
        WHERE school_id = s.school_id AND user_id = u.user_id
      )
    RETURNING *;
    `,
      [email, school_id, user_id]
    )
    .then(({ rows }) => {
      if (rows.length === 0) {
        return Promise.reject({
          msg: "The school or user email does not exist",
          status: 400,
        });
      }
      return rows[0];
    });
};

exports.removeSchoolAdmin = (schoolId, schoolAdminId, removedAdminId) => {
  return db
    .query(
      `
    DELETE FROM school_owners_junction
    WHERE school_id = $1
    AND user_id = $3
    AND EXISTS (
      SELECT 1 
      FROM school_owners_junction 
      WHERE school_id = $1 
      AND user_id = $2
    )
    RETURNING *;
    `,
      [schoolId, schoolAdminId, removedAdminId]
    )
    .then(({ rows }) => {
      if (rows.length === 0) {
        return Promise.reject({
          msg: "The school admin does not exist",
          status: 400,
        });
      }
      return rows[0];
    });
};

// School Parent Process

exports.fetchParentAccessRequests = (userId, schoolId, status = "Pending") => {
  // School admin check
  return (
    db
      .query(
        `
    SELECT * FROM school_owners_junction
    WHERE user_id = $1 AND school_id = $2`,
        [userId, schoolId]
      )
      // Get access requests
      .then(({ rows }) => {
        if (rows.length === 0)
          return Promise.reject({
            status: 401,
            msg: "You are not school admin",
          });
        else {
          return db.query(
            `
        SELECT par.*, u.username, u.user_email
        FROM parent_access_requests par
        JOIN users u ON par.user_id = u.user_id
        WHERE par.school_id = $1 AND par.status = $2`,
            [schoolId, status]
          );
        }
      })
      .then(({ rows }) => {
        return rows;
      })
  );
};

exports.editParentAccess = (
  userId,
  schoolId,
  { parent_access_request_id, status }
) => {
  return db
    .query(
      `
    WITH AdminCheck AS (
      SELECT 1
      FROM school_owners_junction
      WHERE user_id = $1 AND school_id = $2
    )
    UPDATE parent_access_requests
    SET
      status = COALESCE($3, status)
    WHERE parent_access_request_id = $4 AND EXISTS (SELECT 1 FROM AdminCheck)
    RETURNING *;`,
      [userId, schoolId, status, parent_access_request_id]
    )

    .then(({ rows }) => {
      const parentRequest = rows[0];
      if (rows.length === 0) {
        return Promise.reject({ status: 401, msg: "You are not school admin" });
      }
      if (status === "Approved") {
        return db
          .query(
            `
          INSERT INTO school_parents_junction
          (user_id, school_id)
          VALUES ($1, $2)
          RETURNING *
      `,
            [parentRequest.user_id, schoolId]
          )
          .then(({ rows: parentJunction }) => {
            return Promise.all([parentRequest, parentJunction]);
          });
      }
      if ((status === "Rejected")) {
        return db
          .query(`
            DELETE FROM school_parents_junction
            WHERE user_id = $1 AND school_id = $2
            RETURNING *`,
            [parentRequest.user_id, schoolId]
          )
          .then(({ rows: parentRemoved }) => {
            return Promise.all([parentRequest, parentRemoved]);
          });
      }
      return Promise.resolve([parentRequest, null]);
    })
    .then((promiseArr) => {
      return promiseArr;
    });
};

exports.fetchUserEmail = (accessId) => {
  return db.query(
    `SELECT u.user_email, u.username 
    FROM parent_access_requests par
    JOIN users u ON par.user_id = u.user_id
    WHERE par.parent_access_request_id = $1;`, [accessId]
  )
  .then(({rows: user}) => {
    return user[0]
  })
}


exports.insertSchoolParent = (adminId, school_id, {user_email}) => {
  return db.query(`
    WITH AdminCheck AS (
      SELECT 1
      FROM school_owners_junction
      WHERE user_id = $3 AND school_id = $2
    ),
    GetUserId AS (
      SELECT user_id
      FROM users
      WHERE user_email = $1)
    INSERT INTO school_parents_junction (user_id, school_id)
    SELECT user_id, $2
    FROM GetUserId
    WHERE EXISTS (SELECT 1 FROM AdminCheck)
    RETURNING *`, [user_email, school_id, adminId])
  .then(({rows}) => {
    return rows
  })
}

exports.removeSchoolParent = (adminId, schoolId, parentId) => {
  return db.query(`
    DELETE FROM school_parents_junction
    WHERE school_id = $2 AND user_id = $3 
    AND EXISTS (
      SELECT 1 
      FROM school_owners_junction 
      WHERE school_id = $2 
      AND user_id = $1
    )
    RETURNING *;`,[adminId, schoolId, parentId])
  .then(({rows}) => {
    return rows[0]
  })
}

exports.fetchSchoolParents = (userId, schoolId) => {
  return db.query(`
    WITH AdminCheck AS (
      SELECT 1
      FROM school_owners_junction
      WHERE user_id = $1 AND school_id = $2
    )
    SELECT u.username, u.user_email, spj.* FROM school_parents_junction spj
    JOIN users u ON spj.user_id = u.user_id
    WHERE spj.school_id = $2 AND EXISTS (SELECT 1 FROM AdminCheck)`,
    [userId, schoolId])
  .then(({rows}) => {
    return rows
  })
}

exports.insertParentRequest = (userId, {school_id, msg}) => {
  return db.query(`
    SELECT * FROM parent_access_requests
    WHERE school_id = $1 AND user_id = $2`, [school_id, userId])
  .then(({rows}) => {
    if(rows.length > 0) {
      return db.query(`
        UPDATE parent_access_requests
        SET msg = $1, status = 'Pending'
        WHERE parent_access_request_id = $2
        RETURNING *`,
      [msg, rows[0].parent_access_request_id])
    }
    else {
      return db.query(`
        INSERT INTO parent_access_requests (school_id, user_id, msg)
        VALUES ($1, $2, $3)
        RETURNING *`, [school_id, userId, msg])
    }
  })
  .then(({rows}) => {
    return rows[0]
  })
}
