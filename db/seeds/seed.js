const format = require('pg-format');
const {db} = require('../connection');

const seed = () => {
  return db
    .query(`DROP TABLE IF EXISTS posts`)
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
      return db.query(`DROP TABLE IF EXISTS community_members_junction`)
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
      const communitiesCreateTable = db.query(`
        CREATE TABLE communities (
          community_id SERIAL PRIMARY KEY,
          created_date TIMESTAMP DEFAULT NOW(),
          community_name VARCHAR(100) NOT NULL,
          community_description VARCHAR(1000),
          community_img VARCHAR
        )  
      `)
      const businessesCreateTable = db.query(`
        CREATE TABLE businesses (
          business_id SERIAL PRIMARY KEY,
          signup_date TIMESTAMP DEFAULT NOW(),
          business_name VARCHAR(100) NOT NULL,
          business_bio VARCHAR(1000) NOT NULL,
          business_email VARCHAR,
          business_website VARCHAR,
          business_img VARCHAR
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
          church_img VARCHAR
        )  
      `)
      const groupsCreateTable = db.query(`
        CREATE TABLE groups (
          group_id SERIAL PRIMARY KEY,
          created_at TIMESTAMP DEFAULT NOW(),
          group_name VARCHAR(100) NOT NULL,
          group_bio VARCHAR(1000) NOT NULL,
          group_img VARCHAR
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
          school_img VARCHAR
        )  
      `)
      return Promise.all([communitiesCreateTable, businessesCreateTable, churchesCreateTable, groupsCreateTable, schoolsCreateTable])
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
          school_owner INT REFERENCES schools(school_id)
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
          group_id INT REFERENCES groups(group_id)
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
}

module.exports = seed;