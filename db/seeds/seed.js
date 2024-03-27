const format = require('pg-format');
const {db} = require('../connection');
const {hashPasswords} = require('./utils')

const seed = ({businessData, businessOwnerData, churchData, churchMemberData, commentData, communitiesData, communityMemberData, groupAdminData, groupMemberData, groupData, parentData, postData, schoolData, userData}) => {
  return db
    .query(`DROP TABLE IF EXISTS comments`)
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
          community_id INT REFERENCES communities(community_id)
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
          community_id INT REFERENCES communities(community_id)
        )  
      `)
      const groupsCreateTable = db.query(`
        CREATE TABLE groups (
          group_id SERIAL PRIMARY KEY,
          created_at TIMESTAMP DEFAULT NOW(),
          group_name VARCHAR(100) NOT NULL,
          group_bio VARCHAR(1000) NOT NULL,
          group_img VARCHAR,
          community_id INT REFERENCES communities(community_id)
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
          community_id INT REFERENCES communities(community_id)
        )  
      `)
      return Promise.all([businessesCreateTable, churchesCreateTable, groupsCreateTable, schoolsCreateTable])
    })
    .then(() => {
      return db.query(`
        CREATE TABLE users (
          user_id SERIAL PRIMARY KEY,
          date_joined TIMESTAMP DEFAULT NOW(),
          username VARCHAR(60) NOT NULL,
          user_bio VARCHAR(250),
          user_email VARCHAR NOT NULL,
          user_avatar VARCHAR,
          community_owner INT REFERENCES communities(community_id),
          church_owner INT REFERENCES churches(church_id),
          school_owner INT REFERENCES schools(school_id),
          password VARCHAR NOT NULL,
          UNIQUE(user_email)
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
          pdf_link VARCHAR,
          pdf_title VARCHAR,
          author INT REFERENCES users(user_id),
          church_id INT REFERENCES churches(church_id),
          school_id INT REFERENCES schools(school_id),
          business_id INT REFERENCES businesses(business_id),
          group_id INT REFERENCES groups(group_id),
          post_likes INT DEFAULT 0
        )  
      `)
    })
    .then(() => {
      return db.query(`
        CREATE TABLE comments (
          comment_id SERIAL PRIMARY KEY,
          comment_title VARCHAR(100),
          comment_body VARCHAR(1000),
          author INT REFERENCES users(user_id) NOT NULL,
          post_id INT REFERENCES posts(post_id) NOT NULL
        )
      `)
    })
    .then(() => {
      const businessOwnersJunction = db.query(`
        CREATE TABLE business_owners_junction (
          business_junction_id SERIAL PRIMARY KEY,
          business_id INT REFERENCES businesses(business_id) NOT NULL,
          user_id INT REFERENCES users(user_id) NOT NULL
        )
      `)
      const schoolParentsJunction = db.query(`
        CREATE TABLE school_parents_junction (
          parent_junction_id SERIAL PRIMARY KEY,
          school_id INT REFERENCES schools(school_id) NOT NULL,
          user_id INT REFERENCES users(user_id) NOT NULL
        )
      `)
      const groupMembers = db.query(`
        CREATE TABLE group_members (
          group_member_id SERIAL PRIMARY KEY,
          group_id INT REFERENCES groups(group_id) NOT NULL,
          user_id INT REFERENCES users(user_id) NOT NULL
        )
      `)
      const groupAdmins = db.query(`
        CREATE TABLE group_admins (
          group_admin_id SERIAL PRIMARY KEY,
          group_id INT REFERENCES groups(group_id) NOT NULL,
          user_id INT REFERENCES users(user_id) NOT NULL
        )
      `)
      const churchMembers = db.query(`
        CREATE TABLE church_members (
          church_member_id SERIAL PRIMARY KEY,
          church_id INT REFERENCES churches(church_id) NOT NULL,
          user_id INT REFERENCES users(user_id) NOT NULL
        )
      `)
      const communityMembers = db.query(`
        CREATE TABLE community_members (
          community_member_id SERIAL PRIMARY KEY,
          community_id INT REFERENCES communities(community_id) NOT NULL,
          user_id INT REFERENCES users(user_id) NOT NULL
        )
      `)
      return Promise.all([businessOwnersJunction, schoolParentsJunction, groupMembers, groupAdmins, churchMembers, communityMembers])
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
      'INSERT INTO users (username, user_bio, user_email, user_avatar, community_owner, church_owner, school_owner, password) VALUES %L;',
      passwordProtectedUsers[0].map(({username, user_bio, user_email, user_avatar, community_owner, church_owner, school_owner, password}) => [
        username, 
        user_bio, 
        user_email, 
        user_avatar, 
        community_owner, 
        church_owner, 
        school_owner,
        password
      ])
    )
    return db.query(insertUsersQuery)
  })
  .then(() => {
    const insertPostsQuery = format (
      'INSERT INTO posts (post_title, post_description, post_location, post_img, pdf_link, pdf_title, author, church_id, school_id, business_id, group_id) VALUES %L;',
      postData.map(({post_title, post_description, post_location, post_img, pdf_link, pdf_title, author, church_id, school_id, business_id, group_id}) => [
        post_title, 
        post_description, 
        post_location, 
        post_img, 
        pdf_link, 
        pdf_title, 
        author, 
        church_id, 
        school_id, 
        business_id, 
        group_id
      ])
    )
    return db.query(insertPostsQuery)
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

    return Promise.all([insertBusinessOwnerData, insertChurchMemberData, insertCommunityMemberData, insertGroupAdminData, insertGroupMemberData, insertParentsData])
  })
}

module.exports = seed;