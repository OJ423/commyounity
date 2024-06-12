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
      c.community_id;`
  )
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