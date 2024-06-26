const { db } = require("../db/connection");

exports.fetchAllCommunities = () => {
  return db.query (
    `SELECT 
      c.community_id,
      c.created_date,
      c.community_name,
      c.community_description,
      c.community_img,
      COUNT(DISTINCT cm.user_id) AS member_count,
      COUNT(DISTINCT g.group_id) AS group_count,
      COUNT(DISTINCT s.school_id) AS school_count,
      COUNT(DISTINCT ch.church_id) AS church_count,
      COUNT(DISTINCT b.business_id) AS business_count
    FROM 
      communities c
    LEFT JOIN 
      community_members cm ON cm.community_id = c.community_id
    LEFT JOIN
      groups g ON c.community_id = g.community_id
    LEFT JOIN
      schools s ON c.community_id = s.community_id
    LEFT JOIN
      churches ch ON c.community_id = ch.community_id
    LEFT JOIN
      businesses b ON c.community_id = b.community_id
    GROUP BY 
      c.community_id, 
      c.created_date,
      c.community_name,
      c.community_description,
      c.community_img
    ORDER BY 
      c.community_name;`
  )
  .then(({rows}) => {
    return rows
  })
}

exports.fetchCommunityById = (community_id) => {
  return db.query(`
  SELECT
  c.community_id,
  c.community_name,
  c.community_description,
  c.community_img,
  COUNT(DISTINCT cm.user_id) AS member_count,
  COUNT(DISTINCT s.school_id) AS school_count,
  COUNT(DISTINCT ch.church_id) AS church_count,
  COUNT(DISTINCT g.group_id) AS group_count,
  COUNT(DISTINCT b.business_id) AS business_count,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'business_id', b.business_id,
        'business_name', b.business_name,
        'business_img', b.business_img,
        'business_bio', b.business_bio
      )
    ) FILTER (WHERE b.business_id IS NOT NULL), '[]'
  ) AS businesses,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'church_id', ch.church_id,
        'church_name', ch.church_name,
        'church_img', ch.church_img,
        'church_bio', ch.church_bio
      )
    ) FILTER (WHERE ch.church_id IS NOT NULL), '[]'
  ) AS churches,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'school_id', s.school_id,
        'school_name', s.school_name,
        'school_img', s.school_img,
        'school_bio', s.school_bio
      )
    ) FILTER (WHERE s.school_id IS NOT NULL), '[]'
  ) AS schools,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'group_id', g.group_id,
        'group_name', g.group_name,
        'group_img', g.group_img,
        'group_bio', g.group_bio
      )
    ) FILTER (WHERE g.group_id IS NOT NULL), '[]'
        ) AS groups
      FROM
        communities c
      LEFT JOIN
        community_members cm ON cm.community_id = c.community_id
      LEFT JOIN
        schools s ON s.community_id = c.community_id
      LEFT JOIN
        churches ch ON ch.community_id = c.community_id
      LEFT JOIN
        groups g ON g.community_id = c.community_id
      LEFT JOIN
        businesses b ON b.community_id = c.community_id
      WHERE
        c.community_id = $1
      GROUP BY
        c.community_id;`, [community_id])
  .then(({rows}) => {
    return rows
  })
}

exports.fetchCommunityBusinesses = (community_id) => {
  return db.query(`
    SELECT b.*
    FROM businesses b
    WHERE
      b.community_id = $1;
  `, [community_id])
  .then(({rows}) => {
    return rows
  })
}

exports.fetchCommunityGroups = (community_id) => {
  return db.query(`
    SELECT g.*
    FROM groups g
    WHERE
      g.community_id = $1;
  `, [community_id])
  .then(({rows}) => {
    return rows
  })
}

exports.fetchCommunitySchools = (community_id) => {
  return db.query(`
    SELECT s.*
    FROM schools s
    WHERE
      s.community_id = $1;
  `, [community_id])
  .then(({rows}) => {
    return rows
  })
}

exports.fetchCommunityChurches = (community_id) => {
  return db.query(`
    SELECT c.*
    FROM churches c
    WHERE
      c.community_id = $1;
  `, [community_id])
  .then(({rows}) => {
    return rows
  })
}

exports.insertCommunity = (body) => {
  const {user_id, community_name, community_description, community_img} = body
  return db.query(`
    INSERT INTO communities
    (community_name, community_description, community_img)
    VALUES ($1, $2, $3)
    RETURNING *  
  `, [community_name, community_description, community_img])
  .then(({rows}) => {
    const community_id = rows[0].community_id
    db.query(`
      INSERT INTO community_owners_junction
      (community_id, user_id)
      VALUES ($1, $2)
      `, [community_id, user_id])
    db.query(`
      INSERT INTO community_members
      (community_id, user_id)
      VALUES ($1, $2)
      `, [community_id, user_id])
    return rows[0]
  })
}

exports.editCommunity = (user_id, community_id, community_name = null, community_description = null, community_img = null) => {

  return db.query(`
    WITH OwnerCheck AS (
      SELECT 1
      FROM community_owners_junction
      WHERE user_id = $1 AND community_id = $2
    )
    UPDATE communities
    SET
      community_name = COALESCE($3, community_name),
      community_description = COALESCE($4, community_description),
      community_img = COALESCE($5, community_img)
    WHERE community_id = $2 AND EXISTS (SELECT 1 FROM OwnerCheck)
    RETURNING *;
  `, [user_id, community_id, community_name, community_description, community_img])
  .then((result) => {
    if (!result.rows.length) return Promise.reject({ msg: "You are not the community owner so cannot make changes", status: 400 })
    return result.rows[0]
  })
}