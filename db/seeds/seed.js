const format = require('pg-format');
const {db} = require('../connection');
const {hashPasswords} = require('./utils')

const seed = ({businessData, businessOwnerData, churchData, churchMemberData, commentData, communitiesData, communityMemberData, groupAdminData, groupMemberData, groupData, parentData, postData, schoolData, userData, churchOwners, schoolOwners, communityOwners, parentsAccessRequests}) => {
  return db
    .query(`DROP TABLE IF EXISTS comments`)
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS user_post_likes`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS church_owners_junction`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS school_owners_junction`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS community_owners_junction`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS business_owners_junction`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS school_parents_junction`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS group_members`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS group_admins`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS church_members`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS community_members`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS parent_access_requests`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS posts`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS users`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS schools`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS groups`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS churches`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS businesses`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS communities`)
    })
    .then(() => {
      return db.query(`
        CREATE TABLE communities (
          community_id SERIAL PRIMARY KEY,
          created_date TIMESTAMP DEFAULT NOW(),
          community_name VARCHAR(100) NOT NULL,
          community_description VARCHAR(1000),
          community_img VARCHAR,
          UNIQUE(community_name)
        )  
      `)
    })
    .then(() => {
      const businessesCreateTable = db.query(`
        CREATE TABLE businesses (
          business_id SERIAL PRIMARY KEY,
          signup_date TIMESTAMP DEFAULT NOW(),
          business_name VARCHAR(100) NOT NULL,
          business_bio VARCHAR(1000) NOT NULL,
          business_email VARCHAR,
          business_website VARCHAR,
          business_img VARCHAR,
          community_id INT REFERENCES communities(community_id) ON DELETE CASCADE NOT NULL
        )  
      `)
      const churchesCreateTable = db.query(`
        CREATE TABLE churches (
          church_id SERIAL PRIMARY KEY,
          joined_date TIMESTAMP DEFAULT NOW(),
          church_name VARCHAR(100) NOT NULL,
          church_bio VARCHAR(1000),
          church_email VARCHAR,
          church_website VARCHAR,
          church_img VARCHAR,
          community_id INT REFERENCES communities(community_id) ON DELETE CASCADE NOT NULL
        )  
      `)
      const groupsCreateTable = db.query(`
        CREATE TABLE groups (
          group_id SERIAL PRIMARY KEY,
          created_at TIMESTAMP DEFAULT NOW(),
          group_name VARCHAR(100) NOT NULL,
          group_bio VARCHAR(1000) NOT NULL,
          group_img VARCHAR,
          community_id INT REFERENCES communities(community_id) ON DELETE CASCADE NOT NULL
        )  
      `)
      const schoolsCreateTable = db.query(`
        CREATE TABLE schools (
          school_id SERIAL PRIMARY KEY,
          create_date TIMESTAMP DEFAULT NOW(),
          school_name VARCHAR(100) NOT NULL,
          school_bio VARCHAR(1000) NOT NULL,
          school_email VARCHAR,
          school_website VARCHAR,
          school_phone VARCHAR,
          school_img VARCHAR,
          community_id INT REFERENCES communities(community_id) ON DELETE CASCADE NOT NULL
        )  
      `)
      return Promise.all([businessesCreateTable, churchesCreateTable, groupsCreateTable, schoolsCreateTable])
    })
    .then(() => {
      return db.query(`
        CREATE TABLE users (
          user_id SERIAL PRIMARY KEY,
          date_joined TIMESTAMP DEFAULT NOW(),
          username VARCHAR(60) NOT NULL UNIQUE,
          user_bio VARCHAR(250),
          user_email VARCHAR NOT NULL UNIQUE,
          user_avatar VARCHAR,
          password VARCHAR NOT NULL,
          status VARCHAR NOT NULL
        )  
      `)
    })
    .then(() => {
      return db.query(`
        CREATE TABLE posts (
          post_id SERIAL PRIMARY KEY,
          post_date TIMESTAMP DEFAULT NOW(),
          post_title VARCHAR(60) NOT NULL,
          post_description VARCHAR(500) NOT NULL,
          post_location VARCHAR,
          post_img VARCHAR,
          web_link VARCHAR,
          web_title VARCHAR,
          author INT REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
          church_id INT REFERENCES churches(church_id) ON DELETE CASCADE,
          school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
          business_id INT REFERENCES businesses(business_id) ON DELETE CASCADE,
          group_id INT REFERENCES groups(group_id) ON DELETE CASCADE,
          post_likes INT DEFAULT 0
        )  
      `)
    })
    .then(() => {
      return db.query(`
        CREATE TABLE parent_access_requests (
          parent_access_request_id SERIAL PRIMARY KEY,
          created_at TIMESTAMP DEFAULT NOW(),
          school_id INT REFERENCES schools(school_id) ON DELETE CASCADE,
          user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
          msg VARCHAR(500) NOT NULL,
          status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected'))
        )`)
    })
    .then(() => {
      return db.query(`
        CREATE TABLE comments (
          comment_id SERIAL PRIMARY KEY,
          comment_title VARCHAR(100),
          comment_body VARCHAR(1000),
          author INT REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
          post_id INT REFERENCES posts(post_id) ON DELETE CASCADE NOT NULL,
          comment_ref INT REFERENCES comments(comment_id)  ON DELETE CASCADE
        )
      `)
    })
    .then(() => {
      const businessOwnersJunction = db.query(`
        CREATE TABLE business_owners_junction (
          business_junction_id SERIAL PRIMARY KEY,
          business_id INT REFERENCES businesses(business_id) ON DELETE CASCADE NOT NULL,
          user_id INT REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
          UNIQUE(business_id, user_id)
        )
      `)
      const schoolParentsJunction = db.query(`
        CREATE TABLE school_parents_junction (
          parent_junction_id SERIAL PRIMARY KEY,
          school_id INT REFERENCES schools(school_id) ON DELETE CASCADE NOT NULL,
          user_id INT REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
          UNIQUE(school_id, user_id)
        )
      `)
      const groupMembers = db.query(`
        CREATE TABLE group_members (
          group_member_id SERIAL PRIMARY KEY,
          group_id INT REFERENCES groups(group_id) ON DELETE CASCADE NOT NULL,
          user_id INT REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
          UNIQUE(group_id, user_id)
        )
      `)
      const groupAdmins = db.query(`
        CREATE TABLE group_admins (
          group_admin_id SERIAL PRIMARY KEY,
          group_id INT REFERENCES groups(group_id) ON DELETE CASCADE NOT NULL,
          user_id INT REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
          UNIQUE(group_id, user_id)
        )
      `)
      const churchMembers = db.query(`
        CREATE TABLE church_members (
          church_member_id SERIAL PRIMARY KEY,
          church_id INT REFERENCES churches(church_id) ON DELETE CASCADE NOT NULL,
          user_id INT REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
          UNIQUE(church_id, user_id)
        )
      `)
      const communityMembers = db.query(`
        CREATE TABLE community_members (
          community_member_id SERIAL PRIMARY KEY,
          community_id INT REFERENCES communities(community_id) ON DELETE CASCADE NOT NULL,
          user_id INT REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
          UNIQUE(community_id, user_id)
        )
      `)
      const churchOwnersJunction = db.query(`
      CREATE TABLE church_owners_junction (
        church_owner_junction_id SERIAL PRIMARY KEY,
        church_id INT REFERENCES churches(church_id) ON DELETE CASCADE NOT NULL,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
        UNIQUE(church_id, user_id)
      )
    `);
    const schoolOwnersJunction = db.query(`
      CREATE TABLE school_owners_junction (
        school_owner_junction_id SERIAL PRIMARY KEY,
        school_id INT REFERENCES schools(school_id) ON DELETE CASCADE NOT NULL,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
        UNIQUE(school_id, user_id)
      )
    `);
    const communityOwnersJunction = db.query(`
      CREATE TABLE community_owners_junction (
        community_owner_junction_id SERIAL PRIMARY KEY,
        community_id INT REFERENCES communities(community_id) ON DELETE CASCADE NOT NULL,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
        UNIQUE(community_id, user_id)
      )
    `);
    const userPostLikes = db.query(`
      CREATE TABLE user_post_likes (
        user_post_likes_id SERIAL PRIMARY KEY,
        post_id INT REFERENCES posts(post_id) ON DELETE CASCADE NOT NULL,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
        UNIQUE(post_id, user_id)
      )`
    );
      return Promise.all([businessOwnersJunction, schoolParentsJunction, groupMembers, groupAdmins, churchMembers, communityMembers, churchOwnersJunction, schoolOwnersJunction, communityOwnersJunction])
    })
    .then(() => {
      const insertCommunitiesQuery = format (
        'INSERT INTO communities (community_name, community_description, community_img) VALUES %L;',
        communitiesData.map(({community_name, community_description, community_img}) => [
          community_name, 
          community_description, 
          community_img,
        ])
      )
      return db.query(insertCommunitiesQuery)
    })
  .then(() => {
    const insertBusinessesQuery = format (
      'INSERT INTO businesses (business_name, business_bio, business_email, business_website, business_img, community_id) VALUES %L;',
      businessData.map(({business_name, business_bio, business_email, business_website, business_img, community_id}) => [
        business_name, 
        business_bio, 
        business_email, 
        business_website, 
        business_img, 
        community_id,
      ])
    )
    const insertBusinessData = db.query(insertBusinessesQuery)

    const insertChurchesQuery = format (
      'INSERT INTO churches (church_name, church_bio, church_email, church_website, church_img, community_id) VALUES %L;',
      churchData.map(({church_name, church_bio, church_email, church_website, church_img, community_id}) => [
        church_name, 
        church_bio, 
        church_email, 
        church_website, 
        church_img, 
        community_id,
      ])
    )
    const insertChurchData = db.query(insertChurchesQuery)

    const insertGroupsQuery = format (
      'INSERT INTO groups (group_name, group_bio, group_img, community_id) VALUES %L;',
      groupData.map(({group_name, group_bio, group_img, community_id}) => [
        group_name, 
        group_bio, 
        group_img, 
        community_id,
      ])
    )
    const insertGroupData = db.query(insertGroupsQuery)

    const insertSchoolQuery = format (
      'INSERT INTO schools (school_name, school_bio, school_email, school_website, school_phone, school_img, community_id) VALUES %L;',
      schoolData.map(({school_name, school_bio, school_email, school_website, school_phone, school_img, community_id}) => [
        school_name, 
        school_bio, 
        school_email, 
        school_website, 
        school_phone, 
        school_img, 
        community_id,
      ])
    )
    const insertSchoolData = db.query(insertSchoolQuery)

    return Promise.all([insertBusinessData, insertChurchData, insertGroupData, insertSchoolData])
  })
  .then(() => {
    const passwordProtected = userData.map((user) => {
      return hashPasswords(user)
    })

    return Promise.all([passwordProtected])
  })
  .then((passwordProtectedUsers) => {
    const insertUsersQuery = format (
      'INSERT INTO users (username, user_bio, user_email, user_avatar, password, status) VALUES %L;',
      passwordProtectedUsers[0].map(({username, user_bio, user_email, user_avatar, password, status}) => [
        username, 
        user_bio, 
        user_email, 
        user_avatar, 
        password,
        status
      ])
    )
    return db.query(insertUsersQuery)
  })
  .then(() => {
    const insertPostsQuery = format (
      'INSERT INTO posts (post_title, post_description, post_location, post_img, web_link, web_title, author, church_id, school_id, business_id, group_id) VALUES %L;',
      postData.map(({post_title, post_description, post_location, post_img, web_link, web_title, author, church_id, school_id, business_id, group_id}) => [
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
        group_id
      ])
    )
    const insertPostsData = db.query(insertPostsQuery)

    const insertParentRequestsQuery = format (
      `INSERT INTO parent_access_requests
      ( school_id, user_id, msg ) VALUES %L`,
      parentsAccessRequests.map(({school_id, user_id, msg}) => [
        school_id, user_id, msg
      ]) 
    )

    const insertParentRequestsData = db.query(insertParentRequestsQuery)

    return Promise.all([insertPostsData, insertParentRequestsData])
  })
  .then(() => {
    const insertCommentsQuery = format (
      'INSERT INTO comments (comment_title, comment_body, author, post_id) VALUES %L;',
      commentData.map(({comment_title, comment_body, author, post_id}) => [
        comment_title, 
        comment_body, 
        author, 
        post_id,
      ])
    )
    return db.query(insertCommentsQuery)
  })
  .then(() => {
    const insertBusinessOwnersQuery = format (
      'INSERT INTO business_owners_junction (business_id, user_id) VALUES %L;',
      businessOwnerData.map(({business_id, user_id}) => [
        business_id, 
        user_id,
      ])
    )
    const insertBusinessOwnerData = db.query(insertBusinessOwnersQuery)

    const insertParentsQuery = format (
      'INSERT INTO school_parents_junction (school_id, user_id) VALUES %L;',
      parentData.map(({school_id, user_id}) => [
        school_id, 
        user_id,
      ])
    )
    const insertParentsData = db.query(insertParentsQuery)

    const insertGroupMembers = format (
      'INSERT INTO group_members (group_id, user_id) VALUES %L;',
      groupMemberData.map(({group_id, user_id}) => [
        group_id, 
        user_id,
      ])
    )
    const insertGroupMemberData = db.query(insertGroupMembers)
    
    const insertGroupAdminQuery = format (
      'INSERT INTO group_admins (group_id, user_id) VALUES %L;',
      groupAdminData.map(({group_id, user_id}) => [
        group_id, 
        user_id,
      ])
    )
    const insertGroupAdminData = db.query(insertGroupAdminQuery)

    const insertChurchMemberQuery = format (
      'INSERT INTO church_members (church_id, user_id) VALUES %L;',
      churchMemberData.map(({church_id, user_id}) => [
        church_id, 
        user_id,
      ])
    )
    const insertChurchMemberData = db.query(insertChurchMemberQuery)

    const insertCommunityMemberQuery = format (
      'INSERT INTO community_members (community_id, user_id) VALUES %L;',
      communityMemberData.map(({community_id, user_id}) => [
        community_id, 
        user_id,
      ])
    )
    const insertCommunityMemberData = db.query(insertCommunityMemberQuery)

    const insertChurchOwnerQuery = format (
      'INSERT INTO church_owners_junction (church_id, user_id) VALUES %L;',
      churchOwners.map(({church_id, user_id}) => [
        church_id, 
        user_id,
      ])
    )
    const insertChurchOwnerData = db.query(insertChurchOwnerQuery)

    const insertSchoolOwnerQuery = format (
      'INSERT INTO school_owners_junction (school_id, user_id) VALUES %L;',
      schoolOwners.map(({school_id, user_id}) => [
        school_id, 
        user_id,
      ])
    )
    const insertSchoolOwnerData = db.query(insertSchoolOwnerQuery)

    const insertCommunityOwnerQuery = format (
      'INSERT INTO community_owners_junction (community_id, user_id) VALUES %L;',
      communityOwners.map(({community_id, user_id}) => [
        community_id, 
        user_id,
      ])
    )
    const insertCommunityOwnerData = db.query(insertCommunityOwnerQuery)

    const insertPostLike = db.query(`
      INSERT INTO user_post_likes
      (post_id, user_id)
      VALUES 
      (2, 1)`)

    return Promise.all([insertBusinessOwnerData, insertChurchMemberData, insertCommunityMemberData, insertGroupAdminData, insertGroupMemberData, insertParentsData, insertChurchOwnerData, insertSchoolOwnerData, insertCommunityOwnerData])
  })
}

module.exports = seed;