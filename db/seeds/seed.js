const format = require("pg-format");
const { db } = require("../connection");
const { hashPasswords } = require("./utils");
const { v4: uuidv4 } = require("uuid");

const seed = async ({
  businessData,
  businessOwnerData,
  churchData,
  churchMemberData,
  commentData,
  communitiesData,
  communityMemberData,
  groupAdminData,
  groupMemberData,
  groupData,
  parentData,
  postData,
  schoolData,
  userData,
  churchOwners,
  schoolOwners,
  communityOwners,
  parentsAccessRequests,
  blockedUsers,
}) => {
  // Drop Tables
  await db.query(`DROP TABLE IF EXISTS comments`);
  await db.query(`DROP TABLE IF EXISTS user_post_likes`);
  await db.query(`DROP TABLE IF EXISTS church_owners_junction`);
  await db.query(`DROP TABLE IF EXISTS school_owners_junction`);
  await db.query(`DROP TABLE IF EXISTS community_owners_junction`);
  await db.query(`DROP TABLE IF EXISTS business_owners_junction`);
  await db.query(`DROP TABLE IF EXISTS school_parents_junction`);
  await db.query(`DROP TABLE IF EXISTS group_members`);
  await db.query(`DROP TABLE IF EXISTS group_admins`);
  await db.query(`DROP TABLE IF EXISTS church_members`);
  await db.query(`DROP TABLE IF EXISTS community_members`);
  await db.query(`DROP TABLE IF EXISTS parent_access_requests`);
  await db.query(`DROP TABLE IF EXISTS posts`);
  await db.query(`DROP TABLE IF EXISTS blocked_users`);
  await db.query(`DROP TABLE IF EXISTS users`);
  await db.query(`DROP TABLE IF EXISTS schools`);
  await db.query(`DROP TABLE IF EXISTS groups`);
  await db.query(`DROP TABLE IF EXISTS churches`);
  await db.query(`DROP TABLE IF EXISTS businesses`);
  await db.query(`DROP TABLE IF EXISTS communities`);

  // Create Tables
  await db.query(`
        CREATE TABLE communities (
          community_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          created_date TIMESTAMP DEFAULT NOW(),
          community_name VARCHAR(100) NOT NULL,
          community_description VARCHAR(1000),
          community_img VARCHAR,
          UNIQUE(community_name)
        )  
      `);
  await db.query(`
      CREATE TABLE businesses (
        business_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        signup_date TIMESTAMP DEFAULT NOW(),
        business_name VARCHAR(100) NOT NULL,
        business_bio VARCHAR(1000) NOT NULL,
        business_email VARCHAR,
        business_website VARCHAR,
        business_img VARCHAR,
        community_id UUID REFERENCES communities(community_id) ON DELETE CASCADE NOT NULL
      )  
    `);
  await db.query(`
        CREATE TABLE churches (
          church_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          joined_date TIMESTAMP DEFAULT NOW(),
          church_name VARCHAR(100) NOT NULL,
          church_bio VARCHAR(1000),
          church_email VARCHAR,
          church_website VARCHAR,
          church_img VARCHAR,
          community_id UUID REFERENCES communities(community_id) ON DELETE CASCADE NOT NULL
        )  
      `);
  await db.query(`
        CREATE TABLE groups (
          group_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          created_at TIMESTAMP DEFAULT NOW(),
          group_name VARCHAR(100) NOT NULL,
          group_bio VARCHAR(1000) NOT NULL,
          group_img VARCHAR,
          community_id UUID REFERENCES communities(community_id) ON DELETE CASCADE NOT NULL
        )  
      `);
  await db.query(`
        CREATE TABLE schools (
          school_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          create_date TIMESTAMP DEFAULT NOW(),
          school_name VARCHAR(100) NOT NULL,
          school_bio VARCHAR(1000) NOT NULL,
          school_email VARCHAR,
          school_website VARCHAR,
          school_phone VARCHAR,
          school_img VARCHAR,
          community_id UUID REFERENCES communities(community_id) ON DELETE CASCADE NOT NULL
        )  
      `);
  await db.query(`
        CREATE TABLE users (
          user_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          date_joined TIMESTAMP DEFAULT NOW(),
          username VARCHAR(60) NOT NULL UNIQUE,
          user_bio VARCHAR(250),
          user_email VARCHAR NOT NULL UNIQUE,
          user_avatar VARCHAR,
          password VARCHAR NOT NULL,
          status VARCHAR NOT NULL
        )  
      `);
  await db.query(`
        CREATE TABLE posts (
          post_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          post_date TIMESTAMP DEFAULT NOW(),
          post_title VARCHAR(60) NOT NULL,
          post_description VARCHAR(500) NOT NULL,
          post_location VARCHAR,
          post_img VARCHAR,
          post_video_url VARCHAR,
          web_link VARCHAR,
          web_title VARCHAR,
          author UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
          church_id UUID REFERENCES churches(church_id) ON DELETE CASCADE,
          school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
          business_id UUID REFERENCES businesses(business_id) ON DELETE CASCADE,
          group_id UUID REFERENCES groups(group_id) ON DELETE CASCADE,
          post_likes INT DEFAULT 0
        )  
      `);
  await db.query(`
        CREATE TABLE parent_access_requests (
          parent_access_request_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          created_at TIMESTAMP DEFAULT NOW(),
          school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
          msg VARCHAR(500) NOT NULL,
          status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected'))
        )`);
  await db.query(`
        CREATE TABLE comments (
          comment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          comment_title VARCHAR(100),
          comment_body VARCHAR(1000),
          author UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
          post_id UUID REFERENCES posts(post_id) ON DELETE CASCADE NOT NULL,
          comment_ref UUID REFERENCES comments(comment_id)  ON DELETE CASCADE
        )
      `);
  await db.query(`
        CREATE TABLE blocked_users (
          blocked_user_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
          community_id UUID REFERENCES communities(community_id) ON DELETE CASCADE NOT NULL,
          reason VARCHAR,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, community_id)
        )`);
  await db.query(`
        CREATE TABLE business_owners_junction (
          business_junction_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          business_id UUID REFERENCES businesses(business_id) ON DELETE CASCADE NOT NULL,
          user_id UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
          UNIQUE(business_id, user_id)
        )
      `);
  await db.query(`
        CREATE TABLE school_parents_junction (
          parent_junction_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE NOT NULL,
          user_id UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
          UNIQUE(school_id, user_id)
        )
      `);
  await db.query(`
        CREATE TABLE group_members (
          group_member_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          group_id UUID REFERENCES groups(group_id) ON DELETE CASCADE NOT NULL,
          user_id UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
          UNIQUE(group_id, user_id)
        )
      `);
  await db.query(`
        CREATE TABLE group_admins (
          group_admin_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          group_id UUID REFERENCES groups(group_id) ON DELETE CASCADE NOT NULL,
          user_id UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
          UNIQUE(group_id, user_id)
        )
      `);
  await db.query(`
        CREATE TABLE church_members (
          church_member_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          church_id UUID REFERENCES churches(church_id) ON DELETE CASCADE NOT NULL,
          user_id UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
          UNIQUE(church_id, user_id)
        )
      `);
  await db.query(`
        CREATE TABLE community_members (
          community_member_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          community_id UUID REFERENCES communities(community_id) ON DELETE CASCADE NOT NULL,
          user_id UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
          UNIQUE(community_id, user_id)
        )
      `);
  await db.query(`
      CREATE TABLE church_owners_junction (
        church_owner_junction_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        church_id UUID REFERENCES churches(church_id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
        UNIQUE(church_id, user_id)
      )
    `);
  await db.query(`
      CREATE TABLE school_owners_junction (
        school_owner_junction_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
        UNIQUE(school_id, user_id)
      )
    `);
  await db.query(`
      CREATE TABLE community_owners_junction (
        community_owner_junction_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        community_id UUID REFERENCES communities(community_id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
        UNIQUE(community_id, user_id)
      )
    `);
  await db.query(`
      CREATE TABLE user_post_likes (
        user_post_likes_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        post_id UUID REFERENCES posts(post_id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
        UNIQUE(post_id, user_id)
      )`);

  // Insert Data

  const insertCommunitiesQuery = format(
    "INSERT INTO communities (community_name, community_description, community_img) VALUES %L;",
    communitiesData.map(
      ({ community_name, community_description, community_img }) => [
        community_name,
        community_description,
        community_img,
      ]
    )
  );
  await db.query(insertCommunitiesQuery);

  const { rows: liveCommunities } = await db.query(`
    SELECT * FROM communities`);

  const updatedBusinesses = businessData.map((business) => {
    return {
      business_name: business.business_name,
      business_bio: business.business_bio,
      business_email: business.business_email,
      business_website: business.business_website,
      business_img: business.business_img,
      community_id: liveCommunities[business.community_id].community_id,
    };
  });

  const insertBusinessesQuery = format(
    "INSERT INTO businesses ( business_name, business_bio, business_email, business_website, business_img, community_id) VALUES %L;",
    updatedBusinesses.map(
      ({
        business_name,
        business_bio,
        business_email,
        business_website,
        business_img,
        community_id,
      }) => [
        business_name,
        business_bio,
        business_email,
        business_website,
        business_img,
        community_id,
      ]
    )
  );
  await db.query(insertBusinessesQuery);

  const updatedChurches = churchData.map((church) => {
    return {
      church_name: church.church_name,
      church_bio: church.church_bio,
      church_email: church.church_email,
      church_email: church.church_email,
      church_website: church.church_website,
      church_img: church.church_img,
      community_id: liveCommunities[church.community_id].community_id,
    };
  });

  const insertChurchesQuery = format(
    "INSERT INTO churches ( church_name, church_bio, church_email, church_website, church_img, community_id) VALUES %L;",
    updatedChurches.map(
      ({
        church_name,
        church_bio,
        church_email,
        church_website,
        church_img,
        community_id,
      }) => [
        church_name,
        church_bio,
        church_email,
        church_website,
        church_img,
        community_id,
      ]
    )
  );
  await db.query(insertChurchesQuery);

  const updatedGroups = groupData.map((group) => {
    return {
      group_name: group.group_name,
      group_bio: group.group_bio,
      group_img: group.group_img,
      community_id: liveCommunities[group.community_id].community_id,
    };
  });

  const insertGroupsQuery = format(
    "INSERT INTO groups ( group_name, group_bio, group_img, community_id) VALUES %L;",
    updatedGroups.map(({ group_name, group_bio, group_img, community_id }) => [
      group_name,
      group_bio,
      group_img,
      community_id,
    ])
  );
  await db.query(insertGroupsQuery);

  const updatedSchools = schoolData.map((school) => {
    return {
      school_name: school.school_name,
      school_bio: school.school_bio,
      school_email: school.school_email,
      school_website: school.school_website,
      school_phone: school.school_phone,
      school_img: school.school_img,
      community_id: liveCommunities[school.community_id].community_id,
    };
  });

  const insertSchoolQuery = format(
    "INSERT INTO schools ( school_name, school_bio, school_email, school_website, school_phone, school_img, community_id) VALUES %L;",
    updatedSchools.map(
      ({
        school_name,
        school_bio,
        school_email,
        school_website,
        school_phone,
        school_img,
        community_id,
      }) => [
        school_name,
        school_bio,
        school_email,
        school_website,
        school_phone,
        school_img,
        community_id,
      ]
    )
  );
  await db.query(insertSchoolQuery);

  const passwordProtected = userData.map((user) => {
    return hashPasswords(user);
  });

  const insertUsersQuery = format(
    "INSERT INTO users ( username, user_bio, user_email, user_avatar, password, status) VALUES %L;",
    passwordProtected.map(
      ({ username, user_bio, user_email, user_avatar, password, status }) => [
        username,
        user_bio,
        user_email,
        user_avatar,
        password,
        status,
      ]
    )
  );

  await db.query(insertUsersQuery);

  const { rows: liveUsers } = await db.query(`SELECT * FROM users`);
  const { rows: liveGroups } = await db.query(`SELECT * FROM groups`);
  const { rows: liveSchools } = await db.query(`SELECT * FROM schools`);
  const { rows: liveChurches } = await db.query(`SELECT * FROM churches`);
  const { rows: liveBusinesses } = await db.query(`SELECT * FROM businesses`);

  const insertPostsQuery = format(
    "INSERT INTO posts ( post_title, post_description, post_location, post_img, web_link, web_title, author, church_id, school_id, business_id, group_id) VALUES %L;",
    postData.map(
      ({
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
      }) => [
        post_title,
        post_description,
        post_location,
        post_img,
        web_link,
        web_title,
        liveUsers[author].user_id,
        church_id !== null ? liveChurches[church_id].church_id : null,
        school_id !== null ? liveSchools[school_id].school_id : null,
        business_id !== null ? liveBusinesses[business_id].business_id : null,
        group_id !== null ? liveGroups[group_id].group_id : null,
      ]
    )
  );
  await db.query(insertPostsQuery);

  const insertParentRequestsQuery = format(
    `INSERT INTO parent_access_requests
      (  school_id, user_id, msg, status ) VALUES %L`,
    parentsAccessRequests.map(({ school_id, user_id, msg, status }) => [
      liveSchools[school_id].school_id,
      liveUsers[user_id].user_id,
      msg,
      status,
    ])
  );

  await db.query(insertParentRequestsQuery);

  const { rows: livePosts } = await db.query(`SELECT * FROM posts`);
  
  const insertCommentsQuery = format(
    "INSERT INTO comments ( comment_title, comment_body, author, post_id) VALUES %L;",
    commentData.map(({ comment_title, comment_body, author, post_id }) => [
      comment_title,
      comment_body,
      liveUsers[author].user_id,
      livePosts[post_id].post_id,
    ])
  );
  await db.query(insertCommentsQuery);

  const insertBusinessOwnersQuery = format(
    "INSERT INTO business_owners_junction ( business_id, user_id) VALUES %L;",
    businessOwnerData.map(({ business_id, user_id }) => [
      liveBusinesses[business_id].business_id,
      liveUsers[user_id].user_id,
    ])
  );
  await db.query(insertBusinessOwnersQuery);

  const insertParentsQuery = format(
    "INSERT INTO school_parents_junction ( school_id, user_id) VALUES %L;",
    parentData.map(({ school_id, user_id }) => [
      liveSchools[school_id].school_id,
      liveUsers[user_id].user_id,
    ])
  );
  await db.query(insertParentsQuery);

  const insertGroupMembers = format(
    "INSERT INTO group_members ( group_id, user_id) VALUES %L;",
    groupMemberData.map(({ group_id, user_id }) => [
      liveGroups[group_id].group_id,
      liveUsers[user_id].user_id,
    ])
  );
  await db.query(insertGroupMembers);

  const insertGroupAdminQuery = format(
    "INSERT INTO group_admins ( group_id, user_id) VALUES %L;",
    groupAdminData.map(({ group_id, user_id }) => [
      liveGroups[group_id].group_id,
      liveUsers[user_id].user_id,
    ])
  );
  await db.query(insertGroupAdminQuery);

  const insertChurchMemberQuery = format(
    "INSERT INTO church_members ( church_id, user_id) VALUES %L;",
    churchMemberData.map(({ church_id, user_id }) => [
      liveChurches[church_id].church_id,
      liveUsers[user_id].user_id,
    ])
  );
  await db.query(insertChurchMemberQuery);

  const insertCommunityMemberQuery = format(
    "INSERT INTO community_members ( community_id, user_id) VALUES %L;",
    communityMemberData.map(({ community_id, user_id }) => [
      liveCommunities[community_id].community_id,
      liveUsers[user_id].user_id,
    ])
  );
  await db.query(insertCommunityMemberQuery);

  const insertChurchOwnerQuery = format(
    "INSERT INTO church_owners_junction ( church_id, user_id) VALUES %L;",
    churchOwners.map(({ church_id, user_id }) => [
      liveChurches[church_id].church_id,
      liveUsers[user_id].user_id,
    ])
  );
  await db.query(insertChurchOwnerQuery);

  const insertSchoolOwnerQuery = format(
    "INSERT INTO school_owners_junction ( school_id, user_id) VALUES %L;",
    schoolOwners.map(({ school_id, user_id }) => [
      liveSchools[school_id].school_id,
      liveUsers[user_id].user_id,
    ])
  );
  await db.query(insertSchoolOwnerQuery);

  const insertCommunityOwnerQuery = format(
    "INSERT INTO community_owners_junction ( community_id, user_id) VALUES %L;",
    communityOwners.map(({ community_id, user_id }) => [
      liveCommunities[community_id].community_id,
      liveUsers[user_id].user_id,
    ])
  );

  await db.query(insertCommunityOwnerQuery);

  await db.query(
    `
      INSERT INTO user_post_likes (post_id, user_id)
  VALUES ($1, $2);
  `,
    [livePosts[1].post_id, liveUsers[0].user_id]
  );

  const blockedUsersQuery = format(
    `INSERT INTO blocked_users ( community_id, user_id, reason) VALUES %L`,
    blockedUsers.map(({ community_id, user_id, reason }) => [
      liveCommunities[community_id].community_id,
      liveUsers[user_id].user_id,
      reason,
    ])
  );

  await db.query(blockedUsersQuery);
};

module.exports = seed;
