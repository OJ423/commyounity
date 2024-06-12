const { rows, password } = require("pg/lib/defaults");
const { db } = require("../db/connection");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')


exports.fetchUsersMembershipsByUserID = (user_id, community_id) => {
  return db.query(`
    SELECT 
    u.user_id,
    u.username,
    u.user_bio,
    u.user_email,
    u.user_avatar,
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
          'school_bio', s.school_bio
        )
      ) FILTER (WHERE s.school_id IS NOT NULL), '[]'
    ) AS schools,
    COALESCE(
      JSON_AGG(
        DISTINCT JSONB_BUILD_OBJECT(
          'group_id', g.group_id,
          'group_name', g.group_name,
          'group_bio', g.group_bio
        )
      ) FILTER (WHERE g.group_id IS NOT NULL), '[]'
    ) AS groups,
    COALESCE(
      JSON_AGG(
        DISTINCT JSONB_BUILD_OBJECT(
          'church_id', c.church_id,
          'church_name', c.church_name,
          'church_bio', c.church_bio
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
    u.username, 
    u.user_bio, 
    u.user_email, 
    u.user_avatar;`,
    [user_id, community_id])
  .then(({rows}) => {
    if(rows.length === 0) {
      return Promise.reject({ msg: "This user does not exist", status: 404 })
    }
    else {return rows[0]}
  })
}

exports.fetchUserAdminProfiles = (user_id) => {
  return db.query(`
  SELECT c.*, s.*, com.*
  FROM users u
  LEFT JOIN church_owners_junction coj ON u.user_id = coj.user_id
  LEFT JOIN churches c ON coj.church_id = c.church_id
  LEFT JOIN school_owners_junction soj ON u.user_id = soj.user_id
  LEFT JOIN schools s ON soj.school_id = s.school_id
  LEFT JOIN community_owners_junction comj ON u.user_id = comj.user_id
  LEFT JOIN communities com ON comj.community_id = com.community_id
  WHERE u.user_id = $1;`
  , [user_id])
  .then(({rows}) => {
    console.log(rows)
    const dataResponse = rows[0]
    const responseObj = {
      school: {
        school_id: dataResponse.school_id,
        school_name: dataResponse.school_name,
        school_bio: dataResponse.school_bio,
        school_email: dataResponse.school_email,
        school_website: dataResponse.school_website,
        school_phone: dataResponse.school_phone,
        school_img: dataResponse.school_img 
      },
      church: {
        church_id: dataResponse.church_id,
        church_name: dataResponse.church_name,
        church_bio: dataResponse.church_bio,
        church_email: dataResponse.church_email,
        church_website: dataResponse.church_website,
        church_img: dataResponse.church_img
      },
      community: {
        community_name: dataResponse.community_name,
        community_description: dataResponse.community_description,
        community_img: dataResponse.community_img
      }
    }
    return responseObj
  })
}

exports.fetchUserBusinesses = (user_id) => {
  return db.query(`
    SELECT b.*
    FROM businesses b
    LEFT JOIN business_owners_junction boj ON b.business_id = boj.business_id
    LEFT JOIN users u ON boj.user_id = u.user_id
    WHERE u.user_id = $1; 
  `, [user_id])
  .then(({rows}) => {
    return rows
  })
}

exports.fetchUserGroups = (user_id) => {
  return db.query(`
    SELECT g.*
    FROM groups g
    LEFT JOIN group_admins ga ON g.group_id = ga.group_id
    LEFT JOIN users u ON ga.user_id = u.user_id
    WHERE u.user_id = $1;
  `, [user_id])
  .then(({rows}) => {
    return rows
  })
}

exports.loginUserByUserNameValidation = ({username, password}) => {
  const validateEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  let sqlQuery = `
    SELECT *
    FROM users
    WHERE `
  if (validateEmail.test(username)) {
    sqlQuery += `user_email = $1`
  }
  else {
    sqlQuery += `username = $1` 
  }
  return db.query(sqlQuery, [username])

  .then(({rows}) => {

    if (rows.length === 0) {
      return Promise.reject({ msg: "User not found", status: 404 });
    }

    return bcrypt.compare(password, rows[0].password)
      .then(result => {
        if (result) {
          return rows[0];
        } else if (!result) {
          return Promise.reject({ msg: "Passwords do not match. Please try again.", status: 400 });
        } 
      });
  })
}

exports.createNewUser = ({username, email, password}) => {
  return bcrypt.hash(password,1)
  .then((hashedPassword) => {
    const newUser = {username, user_email:email, password: hashedPassword, status: "inactive"}
    return db.query(`
      INSERT INTO users
      (username, user_email, password, status)
      VALUES
      ($1, $2, $3, $4)
      RETURNING *`
    , [newUser.username, newUser.user_email, newUser.password, newUser.status ])
  })
  .then(({rows}) => {
    return rows[0]
  })
}

exports.verifyNewUser = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        return reject({status: 400, msg: `Error verifying user: ${err}`});
      }
      resolve(decodedToken);
    });
  })
  .then((decodedToken) => {
    return db.query(`
    UPDATE users SET status = 'active' WHERE user_email = $1
    RETURNING *`,
    [decodedToken.email]
    )
  })
  .then(({rows}) => {
    return rows[0]
  })
}

exports.verifyUserUpdatePassword = (password, token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        return reject({status: 400, msg: `Error verifying user: ${err}`});
      }
      resolve(decodedToken);
    });
  })
  .then((decodedToken) => {
    return bcrypt.hash(password,10)
    .then((hashedPassword) => {
      return {
        email: decodedToken.email,
        password: hashedPassword
      }
    })
  })
  .then((emailChangeDetails) => {
    return db.query(`
      UPDATE users SET password = $1 WHERE user_email = $2
      RETURNING *`,
      [emailChangeDetails.password, emailChangeDetails.email]
    )
  })
  .then(({rows}) => {
    return rows[0]
  })
} 

exports.removeUser = (userId) => {
  return db.query(`
    DELETE FROM users 
    WHERE user_id = $1`
    ,[userId])
  .then(() => {
    return {msg: 'User deleted.'}
  })
}