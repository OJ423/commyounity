const { rows, password } = require("pg/lib/defaults");
const { db } = require("../db/connection");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.fetchUsersMembershipsByUserID = (user_id, community_id) => {
  return db
    .query(
      `
    SELECT 
    u.user_id,
    u.username,
    COALESCE(
      JSON_AGG(
        DISTINCT JSONB_BUILD_OBJECT(
          'business_id', b.business_id,
          'business_name', b.business_name,
          'business_bio', b.business_bio,
          'business_email', b.business_email,
          'business_website', b.business_website,
          'business_img', b.business_img
        )
      ) FILTER (WHERE b.business_id IS NOT NULL), '[]'
    ) AS businesses,
    COALESCE(
      JSON_AGG(
        DISTINCT JSONB_BUILD_OBJECT(
          'school_id', s.school_id,
          'school_name', s.school_name,
          'school_bio', s.school_bio,
          'school_img', s.school_img
        )
      ) FILTER (WHERE s.school_id IS NOT NULL), '[]'
    ) AS schools,
    COALESCE(
      JSON_AGG(
        DISTINCT JSONB_BUILD_OBJECT(
          'group_id', g.group_id,
          'group_name', g.group_name,
          'group_bio', g.group_bio,
          'group_img', g.group_img
        )
      ) FILTER (WHERE g.group_id IS NOT NULL), '[]'
    ) AS groups,
    COALESCE(
      JSON_AGG(
        DISTINCT JSONB_BUILD_OBJECT(
          'church_id', c.church_id,
          'church_name', c.church_name,
          'church_bio', c.church_bio,
          'church_img', c.church_img
        )
      ) FILTER (WHERE c.church_id IS NOT NULL), '[]'
    ) AS churches
    FROM 
      users u
    LEFT JOIN 
      community_members cmem ON u.user_id = cmem.user_id
    LEFT JOIN 
      businesses b ON cmem.community_id = b.community_id
    LEFT JOIN 
      group_members gm ON u.user_id = gm.user_id
    LEFT JOIN 
      groups g ON gm.group_id = g.group_id AND g.community_id = cmem.community_id
    LEFT JOIN 
      church_members cm ON u.user_id = cm.user_id
    LEFT JOIN 
      churches c ON cm.church_id = c.church_id AND c.community_id = cmem.community_id
    LEFT JOIN 
      school_parents_junction spj ON u.user_id = spj.user_id
    LEFT JOIN 
      schools s ON spj.school_id = s.school_id AND s.community_id = cmem.community_id
    WHERE 
      u.user_id = $1
      AND cmem.community_id = $2
    GROUP BY 
      u.user_id, 
      u.username;`,
      [user_id, community_id]
    )
    .then(({ rows }) => {
      if (rows.length === 0) {
        return Promise.reject({ msg: "This user does not exist", status: 404 });
      } else {
        return rows[0];
      }
    });
};

exports.fetchUserAdminProfiles = (user_id, community_id) => {
  return db
    .query(
      `
  SELECT u.user_id, u.username,
  COALESCE(
    JSON_AGG(
      DISTINCT JSONB_BUILD_OBJECT(
        'business_id', b.business_id,
        'business_name', b.business_name,
        'business_bio', b.business_bio,
        'business_img', b.business_img
      )
    ) FILTER (WHERE b.business_id IS NOT NULL), '[]'
  ) AS businesses,
  COALESCE(
    JSON_AGG(
      DISTINCT JSONB_BUILD_OBJECT(
        'school_id', s.school_id,
        'school_name', s.school_name,
        'school_bio', s.school_bio,
        'school_img', s.school_img
      )
    ) FILTER (WHERE s.school_id IS NOT NULL), '[]'
  ) AS schools,
  COALESCE(
    JSON_AGG(
      DISTINCT JSONB_BUILD_OBJECT(
        'group_id', g.group_id,
        'group_name', g.group_name,
        'group_bio', g.group_bio,
        'group_img', g.group_img
      )
    ) FILTER (WHERE g.group_id IS NOT NULL), '[]'
  ) AS groups,
  COALESCE(
    JSON_AGG(
      DISTINCT JSONB_BUILD_OBJECT(
        'church_id', c.church_id,
        'church_name', c.church_name,
        'church_bio', c.church_bio,
        'church_img', c.church_img
      )
    ) FILTER (WHERE c.church_id IS NOT NULL), '[]'
  ) AS churches
  FROM 
    users u
  LEFT JOIN 
    church_owners_junction coj ON u.user_id = coj.user_id
  LEFT JOIN 
    churches c ON coj.church_id = c.church_id AND c.community_id = $2
  LEFT JOIN 
    school_owners_junction soj ON u.user_id = soj.user_id
  LEFT JOIN 
    schools s ON soj.school_id = s.school_id AND s.community_id = $2
  LEFT JOIN 
    business_owners_junction boj ON u.user_id = boj.user_id
  LEFT JOIN 
    businesses b ON boj.business_id = b.business_id AND b.community_id = $2
  LEFT JOIN 
    group_admins ga ON u.user_id = ga.user_id
  LEFT JOIN 
    groups g ON ga.group_id = g.group_id AND g.community_id = $2
  WHERE u.user_id = $1
  GROUP BY 
    u.user_id, 
    u.username;`,
      [user_id, community_id]
    )
    .then(({ rows }) => {
      return rows[0];
    });
};

exports.loginUserByUserNameValidation = ({ username, password }) => {
  const validateEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  let sqlQuery = `
    SELECT *
    FROM users
    WHERE `;
  if (validateEmail.test(username)) {
    sqlQuery += `user_email = $1`;
  } else {
    sqlQuery += `username = $1`;
  }
  return db
    .query(sqlQuery, [username])

    .then(({ rows }) => {
      if (rows.length === 0) {
        return Promise.reject({ msg: "User not found", status: 404 });
      }

      return bcrypt.compare(password, rows[0].password).then((result) => {
        if (result) {
          return rows[0];
        } else if (!result) {
          return Promise.reject({
            msg: "Passwords do not match. Please try again.",
            status: 400,
          });
        }
      });
    });
};

exports.fetchUsersCommunityMemberships = (user_id) => {
  return db
    .query(
      `
    SELECT
      c.community_id,
      c.community_name
    FROM
      communities c
    JOIN
      community_members cm ON c.community_id = cm.community_id
    WHERE cm.user_id = $1`,
      [user_id]
    )
    .then(({ rows }) => {
      return rows;
    });
};

exports.createNewUser = ({ username, email, password }) => {
  return bcrypt
    .hash(password, 1)
    .then((hashedPassword) => {
      const newUser = {
        username,
        user_email: email,
        password: hashedPassword,
        status: "inactive",
      };
      return db.query(
        `
      INSERT INTO users
      (username, user_email, password, status)
      VALUES
      ($1, $2, $3, $4)
      RETURNING *`,
        [newUser.username, newUser.user_email, newUser.password, newUser.status]
      );
    })
    .then(({ rows }) => {
      return rows[0];
    });
};

exports.verifyNewUser = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        return reject({ status: 400, msg: `Error verifying user: ${err}` });
      }
      resolve(decodedToken);
    });
  })
    .then((decodedToken) => {
      return db.query(
        `
    UPDATE users SET status = 'active' WHERE user_email = $1
    RETURNING *`,
        [decodedToken.email]
      );
    })
    .then(({ rows }) => {
      return rows[0];
    });
};

exports.verifyUserUpdatePassword = (password, token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        return reject({ status: 400, msg: `Error verifying user: ${err}` });
      }
      resolve(decodedToken);
    });
  })
    .then((decodedToken) => {
      return bcrypt.hash(password, 10).then((hashedPassword) => {
        return {
          email: decodedToken.email,
          password: hashedPassword,
        };
      });
    })
    .then((emailChangeDetails) => {
      return db.query(
        `
      UPDATE users SET password = $1 WHERE user_email = $2
      RETURNING *`,
        [emailChangeDetails.password, emailChangeDetails.email]
      );
    })
    .then(({ rows }) => {
      return rows[0];
    });
};

exports.removeUser = (userId) => {
  return db
    .query(
      `
    DELETE FROM users 
    WHERE user_id = $1`,
      [userId]
    )
    .then(() => {
      return { msg: "User deleted." };
    });
};

exports.editUser = (
  user_id,
  {
    username = null,
    user_bio = null,
    user_email = null,
    password = null,
    user_avatar = null,
  }
) => {
  let passwordPromise;
  if (password) {
    passwordPromise = bcrypt.hash(password, 10);
  } else {
    passwordPromise = Promise.resolve(null);
  }

  return passwordPromise
    .then((hashedPassword) => {
      return db.query(
        `
      UPDATE users
      SET
        username = COALESCE($2, username),
        user_bio = COALESCE($3, user_bio),
        user_email = COALESCE($4, user_email),
        password = COALESCE($5, password),
        user_avatar = COALESCE($6, user_avatar)
      WHERE user_id = $1
      RETURNING *;
    `,
        [user_id, username, user_bio, user_email, hashedPassword, user_avatar]
      );
    })
    .then((result) => {
      if (!result.rows.length)
        return Promise.reject({
          msg: "You are not the community owner so cannot make changes",
          status: 400,
        });
      return result.rows[0];
    });
};

exports.addCommunityUser = ({ user_id, community_id }) => {
  return db
    .query(
      `
    WITH inserted AS (
    INSERT INTO community_members (user_id, community_id)
    VALUES ($1, $2)
    RETURNING community_id
    )
    SELECT inserted.community_id, communities.community_name
    FROM inserted
    JOIN communities ON inserted.community_id = communities.community_id;
  `,
      [user_id, community_id]
    )
    .then(({ rows }) => {
      return rows[0];
    });
};

exports.removeCommunityUser = (user_id, community_id) => {
  return db
    .query(
      `
    DELETE FROM community_members
    WHERE user_id = $1 AND community_id = $2
    RETURNING *
    `,
      [user_id, community_id]
    )
    .then(({ rows }) => {
      return rows;
    });
};

exports.addGroupUser = ({ user_id, group_id }) => {
  return db
    .query(
      `
    WITH inserted AS (
    INSERT INTO group_members (user_id, group_id)
    VALUES ($1, $2)
    RETURNING group_id
    )
    SELECT inserted.group_id, groups.group_name, groups.group_bio, groups.group_img
    FROM inserted
    JOIN groups ON inserted.group_id = groups.group_id;
  `,
      [user_id, group_id]
    )
    .then(({ rows }) => {
      return rows[0];
    });
};

exports.removeGroupUser = (user_id, group_id) => {
  return db
    .query(
      `
    DELETE FROM group_members
    WHERE user_id = $1 AND group_id = $2
    RETURNING *
    `,
      [user_id, group_id]
    )
    .then(({ rows }) => {
      return rows;
    });
};

exports.addChurchUser = ({ user_id, church_id }) => {
  return db
    .query(
      `
    WITH inserted AS (
    INSERT INTO church_members (user_id, church_id)
    VALUES ($1, $2)
    RETURNING church_id
    )
    SELECT inserted.church_id, churches.church_name, churches.church_bio, churches.church_img
    FROM inserted
    JOIN churches ON inserted.church_id = churches.church_id;
  `,
      [user_id, church_id]
    )
    .then(({ rows }) => {
      return rows[0];
    });
};

exports.removeChurchUser = (user_id, church_id) => {
  return db
    .query(
      `
    DELETE FROM church_members
    WHERE user_id = $1 AND church_id = $2
    RETURNING *
    `,
      [user_id, church_id]
    )
    .then(({ rows }) => {
      return rows;
    });
};

// Generic Get Admin Users for Entity

exports.fetchAdminUsers = (userId, type, entityId) => {
  let entityTypeIdKey;
  let entityJunctionName;
  let entityJuncIdKey;

  entityTypeIdKey =
    type === "business"
      ? "business_id"
      : type === "church"
      ? "church_id"
      : type === "school"
      ? "school_id"
      : type === "group"
      ? "group_id"
      : type === "community"
      ? "community_id"
      : null;

  entityJunctionName =
    type === "business"
      ? "business_owners_junction"
      : type === "church"
      ? "church_owners_junction"
      : type === "school"
      ? "school_owners_junction"
      : type === "group"
      ? "group_admins"
      : type === "community"
      ? "community_owners_junction"
      : null;

  entityJuncIdKey =
    type === "business"
      ? "business_junction_id"
      : type === "church"
      ? "church_owner_junction_id"
      : type === "school"
      ? "school_owner_junction_id"
      : type === "group"
      ? "group_admin_id"
      : type === "community"
      ? "community_owner_junction_id"
      : null;  


  return db.query(`
    SELECT u.user_id, u.username, u.user_email, e.${entityJuncIdKey}
    FROM ${entityJunctionName} e
    JOIN users u ON e.user_id = u.user_id
    WHERE e.${entityTypeIdKey} = $1
    AND EXISTS (
      SELECT 1
      FROM ${entityJunctionName}
      WHERE ${entityTypeIdKey} = $1
      AND user_id = $2
    )
    `, [entityId, userId])
  .then(({rows}) => {
    if(rows.length === 0) return Promise.reject({status:401, msg: "You are not authorised to see admin users"})
    return rows
  });
};
