const request = require("supertest");
const jwt = require("jsonwebtoken");
const { db } = require("../db/connection");

const app = require("../app.js");
const seed = require("../db/seeds/seed.js");
const testData = require("../db/data/test_data/index.js");
const bcrypt = require("bcryptjs/dist/bcrypt.js");

const JWT_SECRET = process.env.JWT_SECRET;

let testCommunities, testUsers, testSchools, testChurches, testGroups, testBusinesses, testPosts, testParentAccess, testComments;

beforeEach(async () => {
  await seed(testData);
  const communities = await db.query(`SELECT * FROM communities`);
  testCommunities = communities.rows;

  const users = await db.query(`SELECT * FROM users`);
  testUsers = users.rows;

  const schools = await db.query(`SELECT * FROM schools`);
  testSchools = schools.rows;

  const churches = await db.query(`SELECT * FROM churches`);
  testChurches = churches.rows;

  const groups = await db.query(`SELECT * FROM groups`);
  testGroups = groups.rows;

  const businesses = await db.query(`SELECT * FROM businesses`);
  testBusinesses = businesses.rows;

  const posts = await db.query(`SELECT * FROM posts`);
  testPosts = posts.rows;

  const parentRequests = await db.query(`SELECT * FROM parent_access_requests`);
  testParentAccess = parentRequests.rows;

  const comments = await db.query(`SELECT * FROM comments`)
  testComments = comments.rows
});


afterAll(() => db.end());

describe("Communities", () => {
  it("should respond 200 with a list of all communities", () => {
    return request(app)
      .get("/api/communities")
      .expect(200)
      .then(({ body }) => {
        expect(typeof body).toBe("object");
      });
  });
  it("should return 200 with the all communities and a count with the number of members", () => {
    return request(app)
      .get("/api/communities")
      .expect(200)
      .then(({ body }) => {
        expect(body.communities[1].member_count).toBe("14");
      });
  });
  it("should return businesses in the community", () => {
    return request(app)
      .get(`/api/communities/${testCommunities[0].community_id}/businesses`)
      .expect(200)
      .then(({ body }) => {
        expect(body.businesses.length).toBe(6);
      });
  });
  it("should return groups in the community", () => {
    return request(app)
      .get(`/api/communities/${testCommunities[0].community_id}/groups`)
      .expect(200)
      .then(({ body }) => {
        expect(body.groups.length).toBe(6);
      });
  });
  it("should return schools in the community", () => {
    return request(app)
      .get(`/api/communities/${testCommunities[0].community_id}/schools`)
      .expect(200)
      .then(({ body }) => {
        expect(body.schools.length).toBe(2);
      });
  });
  it("should return churches in the community", () => {
    return request(app)
      .get(`/api/communities/${testCommunities[0].community_id}/churches`)
      .expect(200)
      .then(({ body }) => {
        expect(body.churches.length).toBe(2);
      });
  });
  it("should create a new community", () => {
    const token = jwt.sign(
      { id: testUsers[1].user_id, username: "janedoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .post("/api/communities")
      .set("Authorization", `Bearer ${token}`)
      .send({
        user_id: testUsers[1].user_id,
        community_name: "Mobberley",
        community_description:
          "The parish of Mobberley in Cheshire. A thriving and friendly community",
        community_img:
          "https://churchinnmobberley.co.uk/wp-content/uploads/2013/06/sophiewalk3.jpg",
      })
      .expect(201)
      .then(({ body }) => {
        expect(body.newCommunity.community_name).toBe("Mobberley");
        expect(body.newCommunity.community_description).toBe(
          "The parish of Mobberley in Cheshire. A thriving and friendly community"
        );
      });
  });
  it("should reject a new community with an existing name", () => {
    const token = jwt.sign(
      { id: testUsers[3].user_id, username: "mikebrown" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .post("/api/communities")
      .set("Authorization", `Bearer ${token}`)
      .send({
        user_id: testUsers[3].user_id,
        community_name: "Castleton",
        community_description:
          "The parish of Mobberley in Cheshire. A thriving and friendly community",
        community_img:
          "https://churchinnmobberley.co.uk/wp-content/uploads/2013/06/sophiewalk3.jpg",
      })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Community already exists.");
      });
  });

  it("should Patch / Edit a community is the user owns it", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .patch(`/api/communities/edit/${testCommunities[0].community_id}/${testUsers[0].user_id}`)
      .send({
        community_name: "Bourton on the Water",
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.community.community_name).toBe("Bourton on the Water");
        expect(body.community.community_description).toBe(
          "A picturesque village known as the 'Venice of the Cotswolds', famous for its beautiful stone bridges and riverside setting."
        );
      });
  });

  it("should reject a Patch where the user in not a community owner", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .patch(`/api/communities/edit/${testCommunities[1].community_id}/${testUsers[0].user_id}`)
      .send({
        community_name: "Bourton on the Water",
        community_description: "Dead trendy place.",
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe(
          "You are not the community owner so cannot make changes"
        );
      });
  });
  it("should get all community admins for an admin", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .get(`/api/communities/owners/${testCommunities[0].community_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({body}) => {
        expect(body.communityAdmins.length).toBe(2)
      })
  })

  it("should add a community owner by their ID", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
    .post("/api/communities/owners/new/byuserid")
    .set("Authorization", `Bearer ${token}`)
    .send({
      user_id: testUsers[2].user_id,
      community_id: testCommunities[0].community_id
    })
    .expect(201)
    .then(({body}) => {
      expect(body.admin.user_id).toBe(testUsers[2].user_id)
      expect(body.admin.community_id).toBe(testCommunities[0].community_id)
    })
  })
  it("should add another community admin if the requester is admin", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .post(`/api/communities/owners/new/${testCommunities[0].community_id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        user_email: "sarahsmith@example.com",
      })
      .expect(201)
      .then(({ body }) => {
        expect(body.msg).toBe("New community admin added");
        expect(body.admin.community_id).toBe(testCommunities[0].community_id);
        expect(body.admin.user_id).toBe(testUsers[2].user_id);
      });
  })
  it("remove a community admin if the requester is admin", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .delete(`/api/communities/owners/remove/${testCommunities[0].community_id}/${testUsers[3].user_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe("Community admin removed");
      });
  })
  it("gets all community members for a community owner", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
    .get(`/api/communities/members/${testCommunities[0].community_id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200)
    .then(({body}) => {
      expect(body.members.length).toBe(14);
    })
  })
  
  it("gets all community blocked users for a community owner", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
    .get(`/api/communities/members/blocked/${testCommunities[0].community_id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200)
    .then(({body}) => {
      expect(body.blockedUsers.length).toBe(1);
      expect(body.blockedUsers[0].reason).toBe("Troll")
      expect(body.blockedUsers[0].user_id).toBe(testUsers[14].user_id)
      expect(body.blockedUsers[0].username).toBe("jeffgordon")
    })
  })

  it("removes a user from the community by username and adds them to the blocked user table", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .post(`/api/communities/members/block/${testCommunities[0].community_id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        username: "mattwilson",
        reason: "Fitness bore"
      })
      .expect(201)
      .then(({ body }) => {
        expect(body.msg).toBe("User blocked")
        expect(body.blockedUser.user_id).toBe(testUsers[13].user_id)
        expect(body.blockedUser.community_id).toBe(testCommunities[0].community_id);
      });
  })
  it("removes a user from the blocked user table", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .delete(`/api/communities/members/unblock/${testCommunities[0].community_id}/${testUsers[14].user_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe("User unblocked")
      });
  })
  it("prevents blocked user joining the community", () => {
    const token = jwt.sign(
      { id: testUsers[14].user_id, username: "jeffgordon" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .post("/api/users/community/join")
      .set("Authorization", `Bearer ${token}`)
      .send({
        user_id: testUsers[14].user_id,
        community_id: testCommunities[0].community_id,
      })
      .expect(401)
      .then(({ body }) => {
        expect(body.msg).toBe("You are blocked from this community")
      });
  })
});

describe("Users", () => {
  it("should respond with the users data, based on their params", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .get(`/api/users/memberships/${testCommunities[0].community_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.userMemberships.username).toBe("johndoe");
      });
  });
  it("should response with details of the schools, churches, groups and businesses associated with a user", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .get(`/api/users/memberships/${testCommunities[0].community_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.userMemberships.schools.length).toBe(2);
        expect(body.userMemberships.churches.length).toBe(1);
        expect(body.userMemberships.groups.length).toBe(5);
        expect(body.userMemberships.businesses.length).toBe(6);
      });
  });
  it("should respond admin users groups, schools, businesses, and churches", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .get(`/api/users/manage/${testCommunities[0].community_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.schools.length).toBe(2);
        expect(body.churches.length).toBe(1);
        expect(body.businesses.length).toBe(2);
        expect(body.groups.length).toBe(1);
      });
  });

  it("should Patch / Edit a user", () => {
    const token = jwt.sign(
      { id: testUsers[3].user_id, username: "mikebrown" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .patch(`/api/users/edit/${testUsers[3].user_id}`)
      .send({
        user_bio: "I like wildlife and dogs. I also like food and photography",
        user_email: "mikeyb@hoot.com",
        user_avatar: "https://www.1fortyproject.co.uk/artistsimg/mikeyb.jpg",
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.user.username).toBe("mikebrown");
        expect(body.user.user_bio).toBe(
          "I like wildlife and dogs. I also like food and photography"
        );
        expect(body.user.user_email).toBe("mikeyb@hoot.com");
        expect(body.user.user_avatar).toBe(
          "https://www.1fortyproject.co.uk/artistsimg/mikeyb.jpg"
        );
      });
  });

  it("should Patch encrypted user password change", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .patch(`/api/users/edit/${testUsers[0].user_id}`)
      .send({
        password: "l0oni3tun45",
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        const user = body.user;
        return bcrypt.compare("l0oni3tun45", user.password).then((isMatch) => {
          expect(isMatch).toBe(true);
        });
      });
  });

  it("should reject a user attempting to change someone elses profile", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .patch(`/api/users/edit/${testUsers[1].user_id}`)
      .send({
        username: "Gary",
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(403)
      .then(({ body }) => {
        expect(body.msg).toBe("Forbidden: Your security tokens do not match");
      });
  });

  it("should make a user a community member", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .post("/api/users/community/join")
      .send({
        user_id: testUsers[0].user_id,
        community_id: testCommunities[1].community_id,
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(201)
      .then(({ body }) => {
        expect(body.msg).toBe("Successfully joined community");
        expect(body.community.community_id).toBe(testCommunities[1].community_id);
      });
  });
  it("should remove a user as a community member", () => {
    const token = jwt.sign(
      { id: testUsers[2].user_id, username: "sarahsmith" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .delete(`/api/users/community/leave/${testCommunities[0].community_id}/${testUsers[2].user_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe("Successfully left the community");
      });
  });
  it("should add user as group member", () => {
    const token = jwt.sign(
      { id: testUsers[1].user_id, username: "janedoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .post("/api/users/group/join")
      .send({
        user_id: testUsers[1].user_id,
        group_id: testGroups[4].group_id,
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(201)
      .then(({ body }) => {
        expect(body.msg).toBe("Successfully joined group");
        expect(body.group.group_id).toBe(testGroups[4].group_id);
      });
  });
  it("should remove a user as a group member", () => {
    const token = jwt.sign(
      { id: testUsers[1].user_id, username: "janedoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .delete(`/api/users/group/leave/${testGroups[0].group_id}/${testUsers[1].user_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe("Successfully left the group");
      });
  });
  it("should add user as church member", () => {
    const token = jwt.sign(
      { id: testUsers[1].user_id, username: "janedoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .post("/api/users/church/join")
      .send({
        user_id: testUsers[1].user_id,
        church_id: testChurches[1].church_id,
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(201)
      .then(({ body }) => {
        expect(body.msg).toBe("Successfully joined church");
        expect(body.church.church_id).toBe(testChurches[1].church_id);
      });
  });
  it("should remove a user as a church member", () => {
    const token = jwt.sign(
      { id: testUsers[1].user_id, username: "janedoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .delete(`/api/users/church/leave/${testUsers[1].user_id}/${testChurches[1].church_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe("Successfully left the church");
      });
  });
  it('returns admin users for a group ID if the requester is admin', () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    )
    return request(app)
      .get(`/api/users/admin/group/${testGroups[0].group_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({body}) => {
        expect(body.adminUsers[0].username).toBe("johndoe")
        expect(body.adminUsers[1].username).toBe("janedoe")
      })
  });
  it('returns admin users for a church ID if the requester is admin', () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    )
    return request(app)
      .get(`/api/users/admin/church/${testChurches[0].church_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({body}) => {
        expect(body.adminUsers[0].username).toBe("johndoe")
        expect(body.adminUsers[1].username).toBe("janedoe")
      })
  });
  it('returns admin users for a school ID if the requester is admin', () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    )
    return request(app)
      .get(`/api/users/admin/school/${testSchools[1].school_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({body}) => {
        expect(body.adminUsers[0].username).toBe("johndoe")
        expect(body.adminUsers[1].username).toBe("sarahsmith")
      })
  });
  it('returns admin users for a business ID if the requester is admin', () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    )
    return request(app)
      .get(`/api/users/admin/business/${testBusinesses[2].business_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({body}) => {
        expect(body.adminUsers[0].username).toBe("johndoe")
        expect(body.adminUsers[1].username).toBe("janedoe")
      })
  });
  it('returns admin users for a community ID if the requester is admin', () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    )
    return request(app)
      .get(`/api/users/admin/community/${testCommunities[0].community_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({body}) => {
        expect(body.adminUsers[0].username).toBe("johndoe")
      })
  });
});

describe("User Registration, Login, Forgot Password and Verification Tests", () => {
  it("should register a user, send a verification email, and verify the user email", () => {
    return request(app)
      .post("/api/users/register")
      .send({
        username: "ambass01",
        password: "pipedr3ams",
        email: "hoot@hoot.hoot",
      })
      .expect(201)
      .then(({ body }) => {
        expect(body.msg).toBe(
          "User registered successfully. Please check your email to verify your account."
        );

        // Simulate receiving the token (in a real test, this would come from the email)
        const verificationToken = jwt.sign(
          { email: "hoot@hoot.hoot" },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );
        return request(app)
          .get(`/api/users/verify-email?token=${verificationToken}`)
          .expect(200);
      })
      .then(({ body }) => {
        expect(body.msg).toBe(
          "Email verified successfully. Your account is now active."
        );
      });
  });

  it("200 returns a user by their user name assuming the password is correct", () => {
    return request(app)
      .post("/api/users/login")
      .send({
        username: "janedoe",
        password: "JaneDoe456",
      })
      .expect(200)
      .then(({ body }) => {
        const user = body.user;
        const token = body.token;
        expect(user.username).toBe("janedoe");
        expect(user.user_bio).toBe(
          "Lover of books, coffee, and exploring new places. Excited to connect with fellow bookworms and discover hidden gems in the community."
        );
        expect(user.user_avatar).toBe("https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg");
        expect(token).toBeDefined();

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        expect(decoded.id).toBe(user.user_id);
        expect(decoded.username).toBe(user.username);
      });
  });
  it("400 incorrect password message", () => {
    return request(app)
      .post("/api/users/login")
      .send({
        username: "janedoe",
        password: "froggy",
      })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Passwords do not match. Please try again.");
      });
  });
  it("404 user not found", () => {
    return request(app)
      .post("/api/users/login")
      .send({
        username: "janeboe",
        password: "JaneDoe456",
      })
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("User not found");
      });
  });
  it("200 returns a user by email address", () => {
    return request(app)
      .post("/api/users/login")
      .send({
        username: "sarahsmith@example.com",
        password: "RunnerGirl789",
      })
      .expect(200)
      .then(({ body }) => {
        const user = body.user;
        expect(user.username).toBe("sarahsmith");
        expect(user.user_bio).toBe(
          "Dedicated runner and fitness enthusiast. Always up for a challenge and looking to join group runs in the local area."
        );
        expect(user.user_avatar).toBe(
          "https://images.pexels.com/photos/1310522/pexels-photo-1310522.jpeg"
        );
      });
  });
  it("400 incorrect password message - EMAIL", () => {
    return request(app)
      .post("/api/users/login")
      .send({
        username: "sarahsmith@example.com",
        password: "RunnerGirl779",
      })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Passwords do not match. Please try again.");
      });
  });
  it("404 user not found - EMAIL", () => {
    return request(app)
      .post("/api/users/login")
      .send({
        username: "sarahsmith@example.con",
        password: "RunnerGirl779",
      })
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("User not found");
      });
  });

  it("should let a user request an email to reset their password", () => {
    return request(app)
      .post("/api/users/forgot-password")
      .send({
        email: "johndoe@example.com",
      })
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe(
          "Please check your email to change your password."
        );

        // Simulate receiving the token (in a real test, this would come from the email)
        const verificationToken = jwt.sign(
          { email: "johndoe@example.com" },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );
        return request(app)
          .post(`/api/users/update-password?token=${verificationToken}`)
          .send({
            password: "password321",
          })
          .expect(201);
      })
      .then(({ body }) => {
        expect(body.msg).toBe("You password has been changed successfully.");
        return db.query(`SELECT * FROM users WHERE user_email = $1`, [
          "johndoe@example.com",
        ]);
      })
      .then(({ rows }) => {
        const user = rows[0];
        return bcrypt.compare("password321", user.password).then((isMatch) => {
          expect(isMatch).toBe(true);
        });
      });
  });
  it("should reject a password change with an incorrect token", () => {
    return request(app)
      .post("/api/users/forgot-password")
      .send({
        email: "johndoe@example.com",
      })
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe(
          "Please check your email to change your password."
        );

        // Simulate receiving the token (in a real test, this would come from the email)
        const invalidToken = jwt.sign(
          { email: "johndoe@example.com" },
          "invalid token",
          { expiresIn: "1h" }
        );
        return request(app)
          .post(`/api/users/update-password?token=${invalidToken}`)
          .send({
            password: "password321",
          })
          .expect(400);
      })
      .then(({ body }) => {
        expect(body.msg).toBe(
          "Error verifying user: JsonWebTokenError: invalid signature"
        );
      });
  });
  it("should delete user with appropriate token", () => {
    token = jwt.sign(
      { id: testUsers[13].user_id, username: "mattwilson" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .delete(`/api/users/delete/${testUsers[13].user_id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        username: "mattwilson",
      })
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe("User deleted.");
      })
      .then(() => {
        return db.query(`
      SELECT user_id, username FROM USERS`);
      })
      .then(({ rows }) => {
        expect(rows.length).toBe(14);
      });
  });
});

describe("Posts", () => {
  it("should respond with the posts based on a user ID", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .get(`/api/posts/user/${testCommunities[0].community_id}?limit=20`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.posts.length).toBe(11);
      });
  });
  it("should respond with posts filtered by groups", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .get(`/api/posts/user/${testCommunities[0].community_id}?filter=groups&limit=20`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        body.posts.map((post) => {
          expect(post.group_id !== null).toBe(true);
          expect(!post.church_id).toBe(true);
          expect(!post.school_id).toBe(true);
          expect(!post.business_id).toBe(true);
        });
      });
  });
  it("should respond with posts filtered by churches", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .get(`/api/posts/user/${testCommunities[0].community_id}?filter=churches&limit=20`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        body.posts.map((post) => {
          expect(!post.group_id).toBe(true);
          expect(!post.church_id).toBe(false);
          expect(!post.school_id).toBe(true);
          expect(!post.business_id).toBe(true);
        });
      });
  });
  it("should include business posts in the default view", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .get(`/api/posts/user/${testCommunities[0].community_id}?limit=20`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        const businessPosts = body.posts.filter((post) => {
          if (post.business_id !== null) {
            return post;
          }
        });
        expect(businessPosts.length).toBe(2);
      });
  });
  it("should return a single post based on the ID", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .get(`/api/posts/${testPosts[11].post_id}`)
      .expect(200)
      .set("Authorization", `Bearer ${token}`)
      .then(({ body }) => {
        expect(body.post[0].post_title).toBe("New menu");
        expect(body.post[0].post_img).toBe(
          "https://images.pexels.com/photos/2349993/pexels-photo-2349993.jpeg"
        );
      });
  });
  it("should return the post data as well as associated comments", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .get(`/api/posts/${testPosts[11].post_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.post[0].post_title).toBe("New menu");
        expect(body.post[0].post_img).toBe(
          "https://images.pexels.com/photos/2349993/pexels-photo-2349993.jpeg"
        );
        expect(body.comments[0].comment_title).toBe("Love the new menu!");
        expect(body.comments.length).toBe(2);
      });
  });
  it("should add a new post tagged with the relevant group, school etc", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .post("/api/posts")
      .send({
        post_title: "Summer Book Sale",
        post_description:
          "All books £1 or less. Send your kids in with cash to take advantage of this great offer.",
        post_location: "Sunshine Primary School",
        post_img:
          "https://wordsrated.com/wp-content/uploads/2022/02/books-g24d0ae1ed_1920.jpg",
        pdf_link: null,
        pdf_title: null,
        author: testUsers[0].user_id,
        church_id: null,
        school_id: testSchools[1].school_id,
        business_id: null,
        group_id: null,
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(201)
      .then(({ body }) => {
        expect(body.newPost.post_title).toBe("Summer Book Sale");
        expect(body.newPost.post_description).toBe(
          "All books £1 or less. Send your kids in with cash to take advantage of this great offer."
        );
        expect(body.newPost.post_location).toBe("Sunshine Primary School");
      });
  });
  it("should get a users post likes using their token as user ID", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
    .get("/api/posts/user/likes/posts")
    .set("Authorization", `Bearer ${token}`)
    .expect(200)
    .then(({body}) => {
      expect(body.userPostLikes.length).toBe(1)
    })
  })

  it("should let a user like a post and increment the post likes by one", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .patch("/api/posts/post/like")
      .send({ post_id: testPosts[0].post_id, user_id: testUsers[0].user_id })
      .set("Authorization", `Bearer ${token}`)
      .then(({ body }) => {
        expect(body.postLikes.length).toBe(2);
        expect(body.postLikes[0].user_id).toBe(testUsers[0].user_id);
        expect(body.postLikes[1].post_id).toBe(testPosts[0].post_id);
      });
  });
  it("should let a user unlike a post and remove their like only if they have previously liked it", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .patch("/api/posts/post/dislike")
      .send({ post_id: testPosts[1].post_id, user_id: testUsers[0].user_id })
      .set("Authorization", `Bearer ${token}`)
      .then(({ body }) => {
        expect(body.postLikes.length).toBe(0);
      });
  });
  it("should send an error if trying to dislike an unliked post", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .patch("/api/posts/post/dislike")
      .send({ post_id: testPosts[3].post_id, user_id: testUsers[0].user_id })
      .set("Authorization", `Bearer ${token}`)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("You can only remove an existing like");
      });
  });
  it("should delete post if the user is the author", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .delete(`/api/posts/delete/${testPosts[0].post_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe("Post successfully deleted");
      });
  });
  it("should not delete post if the user is the author", () => {
    const token = jwt.sign(
      { id: testUsers[1].user_id, username: "janedoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .delete(`/api/posts/delete/${testPosts[0].post_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("You cannot delete this post");
      });
  });
  it("should let the author of a post edit it", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .patch(`/api/posts/edit/${testPosts[0].post_id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        post_title: "Cup Final Tomorrow!",
        post_description: "Come and support the team bring home the cup",
        post_location: "School playing field",
      })
      .expect(200)
      .then(({ body }) => {
        expect(body.post.post_title).toBe("Cup Final Tomorrow!");
        expect(body.post.post_description).toBe(
          "Come and support the team bring home the cup"
        );
        expect(body.post.post_location).toBe("School playing field");
      });
  });
  it("should not let a user edit a post if they are not the author", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .patch(`/api/posts/edit/${testPosts[1].post_id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        post_title: "Cup Final Tomorrow!",
        post_description: "Come and support the team bring home the cup",
        post_location: "School playing field",
      })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("You cannot edit this post");
      });
  });
});

describe("Businesses", () => {
  it("should respond with the business by ID along with the associated posts", () => {
    return request(app)
      .get(`/api/businesses/${testBusinesses[5].business_id}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.business.business_name).toBe("TasteBuds Catering");
        expect(body.posts.length).toBe(1);
      });
  });
  it("should add a new business, returning the business details", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .post(`/api/businesses/new/${testCommunities[0].community_id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        business_name: "Cath's Cafe",
        business_bio: "Always fresh, always tasty. Sit in or takeaway cafe.",
        business_email: "cath@cathscafe.com",
        business_website: "https://cathscafe.com",
        business_img:
          "https://media-cdn.tripadvisor.com/media/photo-s/0d/36/b6/9a/traditional-english-breakfast.jpg",
        community_id: testCommunities[0].community_id,
      })
      .expect(201)
      .then(({ body }) => {
        expect(body.newBusiness.business_name).toBe("Cath's Cafe");
        expect(body.newBusiness.business_bio).toBe(
          "Always fresh, always tasty. Sit in or takeaway cafe."
        );
      })
      .then(() => {
        return db.query(`SELECT * FROM businesses`);
      })
      .then(({ rows }) => {
        expect(rows.length).toBe(7);
      })
      .then(() => {
        return db.query(`SELECT * FROM business_owners_junction`);
      })
      .then(({ rows }) => {
        expect(rows.length).toBe(7);
        expect(typeof rows[5].business_id).toBe("string");
      });
  });
  it("should Patch / Edit a business is the user owns it", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .patch(`/api/businesses/edit/${testBusinesses[2].business_id}`)
      .send({
        business_name: "Clear Windows",
        business_bio: "PVC windows. 24 year warranty. Pay in cash. No tax.",
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.business.business_name).toBe("Clear Windows");
        expect(body.business.business_bio).toBe(
          "PVC windows. 24 year warranty. Pay in cash. No tax."
        );
      });
  });

  it("should delete a business if the user is an owner", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .delete(`/api/businesses/delete/${testBusinesses[2].business_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe("Business successfully deleted");
      });
  });

  it("should not delete a business if the user is not an owner", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .delete(`/api/businesses/delete/${testBusinesses[0].business_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe(
          "You are not the business owner so cannot make changes"
        );
      });
  });

  it("adds another user as a business owner if the user exists and the requestor is the business owner", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .post(`/api/businesses/owners/new/${testBusinesses[2].business_id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        user_email: "sarahsmith@example.com",
      })
      .expect(201)
      .then(({ body }) => {
        expect(body.msg).toBe("New business owner added");
        expect(body.admin.business_id).toBe(testBusinesses[2].business_id);
        expect(body.admin.user_id).toBe(testUsers[2].user_id);
      });
  });
  it("errors when adding a new business owner that does not exist", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .post(`/api/businesses/owners/new/${testBusinesses[2].business_id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        user_email: "george@orwell.com",
      })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("The user email supplied does not exist");
      });
  });

  it("remove a business admin if the requester is a business owner", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .delete(`/api/businesses/owners/remove/${testBusinesses[2].business_id}/${testUsers[1].user_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe("Business owner removed");
        expect(body.deletedOwner.user_id).toBe(testUsers[1].user_id)
      });
  });
});

describe("Groups", () => {
  it("should respond with a group by ID along with the associated posts", () => {
    return request(app)
      .get(`/api/groups/${testGroups[0].group_id}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.group.group_name).toBe("Young Kickers Football Club");
        expect(body.posts.length).toBe(1);
      });
  });

  it("should add a new group, returning the group details", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .post(`/api/groups/${testCommunities[0].community_id}/${testUsers[0].user_id}`)
      .send({
        group_name: "Walkers Club",
        group_bio: "A walking group meeting up once a month for a walk.",
        group_img:
          "https://experiencelife.lifetime.life/wp-content/uploads/2023/02/apr23-feat-born-to-walk.jpg",
        community_id: testCommunities[0].community_id,
      })
      .set("Authorization", `Bearer ${token}`)

      .expect(201)
      .then(({ body }) => {
        expect(body.newGroup.group_name).toBe("Walkers Club");
        expect(body.newGroup.group_bio).toBe(
          "A walking group meeting up once a month for a walk."
        );
      })
      .then(() => {
        return db.query(`SELECT * FROM groups`);
      })
      .then(({ rows }) => {
        expect(rows.length).toBe(7);
      })
      .then(() => {
        return db.query(`SELECT * FROM group_admins`);
      })
      .then(({ rows }) => {
        expect(rows.length).toBe(8);
        expect(typeof rows[6].group_id).toBe("string");
      })
      .then(() => {
        return db.query(`SELECT user_id FROM group_members`);
      })
      .then(({ rows }) => {
        expect(rows.length).toBe(19);
      });
  });

  it("should Patch / Edit a group if the user owns it", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .patch(`/api/groups/edit/${testGroups[0].group_id}/${testUsers[0].user_id}`)
      .send({
        group_name: "5-14 Kids Football - Young Kickers",
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.group.group_name).toBe(
          "5-14 Kids Football - Young Kickers"
        );
        expect(body.group.group_bio).toBe(
          "Young Kickers Football Club is a community-based club dedicated to providing football training and matches for children aged 7 to 16. Our aim is to develop skills, teamwork, and a love for the game in a fun and supportive environment."
        );
      });
  });

  it("should delete a group if the user is a group admin", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .delete(`/api/groups/delete/${testGroups[0].group_id}/${testUsers[0].user_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe("Group successfully deleted");
      });
  });
  it("should not delete a group if the user is not a group admin", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .delete(`/api/groups/delete/${testGroups[1].group_id}/${testUsers[0].user_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe(
          "You are not the group owner so cannot make changes"
        );
      });
  });

  it("adds another user as a group admin if the user exists and the requestor is a group admin", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .post(`/api/groups/owners/new/${testGroups[0].group_id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        user_email: "sarahsmith@example.com",
      })
      .expect(201)
      .then(({ body }) => {
        expect(body.msg).toBe("New group admin added");
        expect(body.admin.group_id).toBe(testGroups[0].group_id);
        expect(body.admin.user_id).toBe(testUsers[2].user_id);
      });
  });
  it("errors when adding a new group admin that does not exist", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .post(`/api/groups/owners/new/${testGroups[0].group_id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        user_email: "george@orwell.com",
      })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("The group or user email does not exist");
      });
  });
    it("adds another user as a group admin if the user exists and the requestor is a group admin", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .post(`/api/groups/owners/new/${testGroups[0].group_id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        user_email: "sarahsmith@example.com",
      })
      .expect(201)
      .then(({ body }) => {
        expect(body.msg).toBe("New group admin added");
        expect(body.admin.group_id).toBe(testGroups[0].group_id);
        expect(body.admin.user_id).toBe(testUsers[2].user_id);
      });
  });
  it("adds removes a user as a group admin if the requester is a group admin", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .delete(`/api/groups/owners/remove/${testGroups[0].group_id}/${testUsers[1].user_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe("Group admin removed");
      });
  });
});

describe("Schools", () => {
  it("should respond with a school by ID along with the associated posts", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .get(`/api/schools/${testSchools[0].school_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.school.school_name).toBe("Little Sprouts Nursery");
        expect(body.posts.length).toBe(1);
      });
  });
  it("should add a new school, returning the school details", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .post(`/api/schools/new/${testCommunities[0].community_id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        school_name: "All Saints Prep School",
        school_bio:
          "Prepare your children in the best possible way. All Saints nurtures young minds.",
        school_email: "admin@school.com",
        school_website: "https://www.school.com",
        school_phone: "01234 5678910",
        school_img:
          "https://upload.wikimedia.org/wikipedia/commons/f/f1/School-education-learning-1750587-h.jpg",
        community_id: testCommunities[0].community_id,
      })
      .expect(201)
      .then(({ body }) => {
        expect(body.newSchool.school_name).toBe("All Saints Prep School");
        expect(body.newSchool.school_bio).toBe(
          "Prepare your children in the best possible way. All Saints nurtures young minds."
        );
      })
      .then(() => {
        return db.query(`SELECT * FROM schools`);
      })
      .then(({ rows }) => {
        expect(rows.length).toBe(3);
      })
      .then((rows) => {
        return db.query(`
          SELECT * FROM school_owners_junction`);
      })
      .then(({ rows }) => {
        expect(typeof rows[2].school_id).toBe("string");
      })
      .then(() => {
        return db.query(`
          SELECT user_id FROM school_parents_junction`);
      })
      .then(({ rows }) => {
        expect(rows.length).toBe(6);
      });
  });
  it("should Patch / Edit a school if the user owns it", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .patch(`/api/schools/edit/${testSchools[1].school_id}`)
      .send({
        school_website: "www.sunshineschool.edu",
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.school.school_name).toBe("Sunshine Primary School");
        expect(body.school.school_website).toBe("www.sunshineschool.edu");
      });
  });

  it("should delete a school if the user is admin", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .delete(`/api/schools/delete/${testSchools[1].school_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe("School successfully deleted");
      });
  });
  it("should not delete a school if the user is not admin", () => {
    const token = jwt.sign(
      { id: testUsers[1].user_id, username: "janedoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .delete(`/api/schools/delete/${testSchools[0].school_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe(
          "You are not the school owner so cannot make changes"
        );
      });
  });

  it("adds another user as a school admin if the user exists and the requestor is a school admin", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .post(`/api/schools/owners/new/${testSchools[1].school_id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        user_email: "janedoe@example.com",
      })
      .expect(201)
      .then(({ body }) => {
        expect(body.msg).toBe("New school admin added");
        expect(body.admin.school_id).toBe(testSchools[1].school_id);
        expect(body.admin.user_id).toBe(testUsers[1].user_id);
      });
  });
  it("errors when adding a new school admin that does not exist", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .post(`/api/schools/owners/new/${testSchools[1].school_id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        user_email: "george@orwell.com",
      })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("The school or user email does not exist");
      });
  });

  it("errors when when the school does not exist", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .post(`/api/schools/owners/new/baca2199-f1b9-4b47-a846-575e8e4d4ca5`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        user_email: "janedoe@example.com",
      })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("The school or user email does not exist");
      });
  });

  it("removes another user as a school admin if the user exists and the requestor is a school admin", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .delete(`/api/schools/owners/remove/${testSchools[1].school_id}/${testUsers[2].user_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe("School admin removed");
      });
  });
});

describe("School Parent Mechanism", () => {
  it("gets all users requesting parent access", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
    .get(`/api/schools/requests/${testSchools[0].school_id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200)
    .then(({body}) => {
      expect(body.parentAccessRequests.length).toBe(2)
      expect(body.parentAccessRequests[0].user_id).toBe(testUsers[1].user_id)
      expect(body.parentAccessRequests[0].username).toBe("janedoe")
      expect(body.parentAccessRequests[0].school_id).toBe(testSchools[0].school_id)
      expect(body.parentAccessRequests[1].user_id).toBe(testUsers[2].user_id)
    })
  })
  it("approves parent access and adds them to parent junction table", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
    .patch(`/api/schools/requests/status/${testSchools[0].school_id}`)
    .expect(200)
    .set("Authorization", `Bearer ${token}`)
    .send({
      parent_access_request_id: testParentAccess[0].parent_access_request_id,
      status: "Approved"
    })
    .then(({body}) => {
      expect(body.parentRequest.status).toBe("Approved")
      expect(body.parentJunction[0].user_id).toBe(testUsers[1].user_id)
    })
  })
  it("rejects parent access and sends email rejection", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
    .patch(`/api/schools/requests/status/${testSchools[0].school_id}`)
    .expect(200)
    .set("Authorization", `Bearer ${token}`)
    .send({
      parent_access_request_id: testParentAccess[0].parent_access_request_id,
      status: "Rejected"
    })
    .then(({body}) => {
      expect(body.parentRequest.status).toBe("Rejected")
    })
  })

  it("adds a parent by email address direct to parent junction table and updates request junction table if row exists", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
    .post(`/api/schools/${testSchools[0].school_id}/parent/add`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      user_email: "janedoe@example.com",
    })
    .expect(201)
    .then(({body}) => {
      expect(body.msg).toBe("Parent added")

    })
  })
  it("gets all parents of a school", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
    .get(`/api/schools/parents/${testSchools[1].school_id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200)
    .then(({body}) => {
      expect(body.parents.length).toBe(3)
      expect(body.parents[0].username).toBe("johndoe")
    })
  })

  it("removes parent access directly via parent junction table", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
    .delete(`/api/schools/${testSchools[0].school_id}/parent/remove/${testUsers[12].user_id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200)
    .then(({body}) => {
      expect(body.msg).toBe("Parent deleted")
      expect(body.deletedParent.user_id).toBe(testUsers[12].user_id)

    })
  })
  it("allows a parent request access to a school", () => {
    const token = jwt.sign(
      { id: testUsers[3].user_id, username: "mikebrown" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
    .post('/api/schools/access')
    .set("Authorization", `Bearer ${token}`)
    .send({
      school_id: testSchools[0].school_id,
      msg: "Hi, my boy Herbert Brown goes to your school in year 2. Can you please give me access."
    })
    .expect(201)
    .then(({body}) => {
      expect(body.parentRequest.msg).toBe("Hi, my boy Herbert Brown goes to your school in year 2. Can you please give me access.")
      expect(body.parentRequest.user_id).toBe(testUsers[3].user_id)
    })
  })

  it("allows a parent re-request changing their existing request back to pending ", () => {
    const token = jwt.sign(
      { id: testUsers[4].user_id, username: "emilywilson" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
    .post('/api/schools/access')
    .set("Authorization", `Bearer ${token}`)
    .send({
      school_id: testSchools[0].school_id,
      msg: "Hi, Sorry I sent garbage before. I meant to say my child Oscar the Grouch goes to your school. Please give me access."
    })
    .expect(201)
    .then(({body}) => {
      expect(body.parentRequest.msg).toBe("Hi, Sorry I sent garbage before. I meant to say my child Oscar the Grouch goes to your school. Please give me access.")
      expect(body.parentRequest.user_id).toBe(testUsers[4].user_id)
    })
  })
})

describe("Churches", () => {
  it("should respond with a church by ID along with the associated posts", () => {
    return request(app)
      .get(`/api/churches/${testChurches[0].church_id}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.church.church_name).toBe("St. Paul's Methodist Church");
        expect(body.posts.length).toBe(1);
      });
  });
  it("should add a new church, returning the church details", () => {
    const token = jwt.sign(
      { id: testUsers[2].user_id, username: "sarahsmith" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .post(`/api/churches/${testCommunities[0].community_id}`)
      .send({
        church_name: "Crazy Church",
        church_bio: "We are the descendants of the lizard people.",
        church_email: "admin@crazychurch.com",
        church_website: "https://www.crazychurch.com",
        church_img:
          "https://upload.wikimedia.org/wikipedia/commons/f/f1/School-education-learning-1750587-h.jpg",
        community_id: testCommunities[0].community_id,
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(201)
      .then(({ body }) => {
        expect(body.newChurch.church_name).toBe("Crazy Church");
        expect(body.newChurch.church_bio).toBe(
          "We are the descendants of the lizard people."
        );
      })
      .then(() => {
        return db.query(`SELECT * FROM churches`);
      })
      .then(({ rows }) => {
        expect(rows.length).toBe(3);
      })
      .then(() => {
        return db.query(`
        SELECT * FROM church_owners_junction`);
      })
      .then(({ rows }) => {
        expect(rows[2].user_id).toBe(testUsers[2].user_id);
        expect(typeof rows[2].church_id).toBe("string");
      })
  });

  it("should Patch / Edit a church if the user owns it", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .patch(`/api/churches/edit/${testChurches[0].church_id}`)
      .send({
        church_email: "info@stpauls.com",
        church_website: "https://www.stpauls.com",
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.church.church_name).toBe("St. Paul's Methodist Church");
        expect(body.church.church_website).toBe("https://www.stpauls.com");
        expect(body.church.church_email).toBe("info@stpauls.com");
      });
  });

  it("should delete a church if the user is admin", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .delete(`/api/churches/delete/${testChurches[0].church_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe("Church successfully deleted");
      });
  });
  it("should not delete a church if the user is not admin", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .delete(`/api/churches/delete/${testChurches[1].church_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe(
          "You are not the church owner so cannot make changes"
        );
      });
  });

  it("adds another user as a church admin if the user exists and the requestor is a church admin", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .post(`/api/churches/owners/new/${testChurches[0].church_id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        user_email: "sarahsmith@example.com",
      })
      .expect(201)
      .then(({ body }) => {
        expect(body.msg).toBe("New church admin added");
        expect(body.admin.church_id).toBe(testChurches[0].church_id);
        expect(body.admin.user_id).toBe(testUsers[2].user_id);
      });
  });
  it("errors when adding a new church admin that does not exist", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .post(`/api/churches/owners/new/${testChurches[0].church_id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        user_email: "george@orwell.com",
      })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("The church or user email does not exist");
      });
  });

  it("removes another user as a church admin if the user exists and the requestor is a church admin", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .delete(`/api/churches/owners/remove/${testChurches[0].church_id}/${testUsers[1].user_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe("Church admin removed");
        expect(body.deletedAdmin.user_id).toBe(testUsers[1].user_id);
      });
  });
});

describe("Comments", () => {
  it("adds a new comment to a post", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .post(`/api/posts/${testPosts[0].post_id}/comment/new`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        comment_title: "Come on boys!",
        comment_body: "We've got our fingers and toes crossed for you all",
      })
      .expect(201)
      .then(({ body }) => {
        expect(body.comment.comment_title).toBe("Come on boys!");
        expect(body.comment.comment_body).toBe(
          "We've got our fingers and toes crossed for you all"
        );
        expect(body.comment.author).toBe(testUsers[0].user_id);
      });
  });

  it("Lets a comments author edit their comment", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .patch(`/api/posts/comment/${testComments[9].comment_id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        comment_title: "Cannot wait",
        comment_body: "I've been getting the training in with the wife",
      })
      .expect(200)
      .then(({ body }) => {
        const comment = body.comment;
        expect(comment.comment_title).toBe("Cannot wait");
        expect(comment.comment_body).toBe(
          "I've been getting the training in with the wife"
        );
        expect(comment.author).toBe(testUsers[0].user_id);
        expect(comment.post_id).toBe(testPosts[15].post_id);
      });
  });

  it("will not let a user edit a comments if they are not the author", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return request(app)
      .patch(`/api/posts/comment/${testComments[1].comment_id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        comment_title: "Cannot wait",
        comment_body: "I've been getting the training in with the wife",
      })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("You cannot edit this comment");
      });
  });

  it("will let a user delete their own comment", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .delete(`/api/posts/comment/delete/${testComments[9].comment_id}/${testComments[9].post_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe("Successfully deleted");
        expect(body.comment.comment_title).toBe("Can't wait!");
      });
  });

  it("will not let a user delete a comment that is not their own", () => {
    const token = jwt.sign(
      { id: testUsers[0].user_id, username: "johndoe" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return request(app)
      .delete(`/api/posts/comment/delete/${testComments[1].comment_id}/${testComments[1].post_id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("You cannot delete this comment");
      });
  });
});
