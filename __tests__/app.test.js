const request = require("supertest");
const jwt = require('jsonwebtoken')
const { db } = require("../db/connection");

const app = require("../app.js");
const seed = require("../db/seeds/seed.js");
const testData = require("../db/data/test_data/index.js");
const bcrypt = require("bcryptjs/dist/bcrypt.js");

const JWT_SECRET = process.env.JWT_SECRET

beforeEach(() => seed(testData));
afterAll(() => db.end());

describe('Communities', () => {
  it('should respond 200 with a list of all communities',() => {
    return request(app)
      .get('/api/communities')
      .expect(200)
      .then(({body}) => {
        expect(typeof body).toBe("object")
      })
  })
  it('should return 200 with the all communities and a count with the number of members',() => {
    return request(app)
      .get('/api/communities')
      .expect(200)
      .then(({body}) => {
        expect(body.communities[1].member_count).toBe('14')
      })
  })
  it('should return businesses in the community', () => {
    return request(app)
      .get('/api/communities/1/businesses')
      .expect(200)
      .then(({body}) => {
        expect(body.businesses.length).toBe(6)
      })
  })
  it('should return groups in the community', () => {
    return request(app)
      .get('/api/communities/1/groups')
      .expect(200)
      .then(({body}) => {
        expect(body.groups.length).toBe(6)
      })
  })
  it('should return schools in the community', () => {
    return request(app)
      .get('/api/communities/1/schools')
      .expect(200)
      .then(({body}) => {
        expect(body.schools.length).toBe(2)
      })
  })
  it('should return churches in the community', () => {
    return request(app)
      .get('/api/communities/1/churches')
      .expect(200)
      .then(({body}) => {
        expect(body.churches.length).toBe(2)
      })
  })
  it('should create a new community', () => {
    const token = jwt.sign({ id: 2, username: 'janedoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
      .post('/api/communities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: 2,
        community_name: "Mobberley",
        community_description: "The parish of Mobberley in Cheshire. A thriving and friendly community",
        community_img: "https://churchinnmobberley.co.uk/wp-content/uploads/2013/06/sophiewalk3.jpg"
      })
      .expect(201)
      .then(({body}) => {
        expect(body.newCommunity.community_name).toBe("Mobberley")
        expect(body.newCommunity.community_description).toBe("The parish of Mobberley in Cheshire. A thriving and friendly community")
        expect(body.newCommunity.community_id).toBe(6)

      })
  })
  it('should reject a new community with an existing name', () => {
    const token = jwt.sign({ id: 4, username: 'mikebrown' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
      .post('/api/communities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        user_id: 4,
        community_name: "Castleton",
        community_description: "The parish of Mobberley in Cheshire. A thriving and friendly community",
        community_img: "https://churchinnmobberley.co.uk/wp-content/uploads/2013/06/sophiewalk3.jpg"
      })
      .expect(400)
      .then(({body}) => {
        expect(body.msg).toBe("Community already exists.")
      })
  })

  it('should Patch / Edit a community is the user owns it', () => {
    const token = jwt.sign({ id: 1, username: 'johndoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
    .patch('/api/communities/edit/1/1')
    .send({
      community_name: "Bourton on the Water"
    })
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .then(({body}) => {
      expect(body.community.community_name).toBe("Bourton on the Water")
      expect(body.community.community_description).toBe("A picturesque village known as the 'Venice of the Cotswolds', famous for its beautiful stone bridges and riverside setting.")
    })
  })

  it('should reject a Patch where the user in not a community owner', () => {
    const token = jwt.sign({ id: 1, username: 'johndoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
    .patch('/api/communities/edit/2/1')
    .send({
      community_name: "Bourton on the Water",
      community_description: "Dead trendy place."
    })
    .set('Authorization', `Bearer ${token}`)
    .expect(400)
    .then(({body}) => {
      expect(body.msg).toBe("You are not the community owner so cannot make changes")
    })
  })

})

describe('Users', () => {
  it('should respond with the users data, based on their params', () => {
    const token = jwt.sign({ id: 1, username: 'johndoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
      .get('/api/users/1/1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .then(({body}) => {
        expect(body.userMemberships.username).toBe('johndoe')
      })
  })
  it('should respond 404 and a cannot find message for unfound users', () => {
    const token = jwt.sign({ id: 1, username: 'johndoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
      .get('/api/users/47/1')
      .set('Authorization', `Bearer ${token}`)
      .expect(403)
      .then(({body}) => {
        expect(body.msg).toBe("Forbidden: Your security tokens do not match")
      })
  })
  it('should response with details of the schools, churches, groups and businesses associated with a user', () => {
    const token = jwt.sign({ id: 1, username: 'johndoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
      .get('/api/users/1/1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .then(({body}) => {
        expect(body.userMemberships.schools.length).toBe(2)
        expect(body.userMemberships.churches.length).toBe(1)
        expect(body.userMemberships.groups.length).toBe(5)
        expect(body.userMemberships.businesses.length).toBe(6)
      })
  })
  it('should respond admin users groups, schools, businesses, and churches', () => {
    const token = jwt.sign({ id: 1, username: 'johndoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
    .get('/api/users/manage/1/1')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .then(({body}) => {
      expect(body.schools.length).toBe(1)
      expect(body.churches.length).toBe(1)
      expect(body.businesses.length).toBe(2)
      expect(body.groups.length).toBe(1)
    })
  })

  it('should Patch / Edit a user', () => {
    const token = jwt.sign({ id: 4, username: 'mikebrown' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
    .patch('/api/users/edit/4')
    .send({
      user_bio: "I like wildlife and dogs. I also like food and photography",
      user_email: "mikeyb@hoot.com",
      user_avatar: "https://www.1fortyproject.co.uk/artistsimg/mikeyb.jpg"
    })
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .then(({body}) => {
      expect(body.user.username).toBe("mikebrown")
      expect(body.user.user_bio).toBe("I like wildlife and dogs. I also like food and photography")
      expect(body.user.user_email).toBe("mikeyb@hoot.com")
      expect(body.user.user_avatar).toBe("https://www.1fortyproject.co.uk/artistsimg/mikeyb.jpg")
    })
  })

  it('should Patch encrypted user password change', () => {
    const token = jwt.sign({ id: 1, username: 'johndoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
    .patch('/api/users/edit/1')
    .send({
      password: "l0oni3tun45"
    })
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .then(({body}) => {
      const user = body.user;
        return bcrypt.compare('l0oni3tun45', user.password)
          .then(isMatch => {
            expect(isMatch).toBe(true);
          });
    })
  })

  it('should reject a user attempting to change someone elses profile', () => {
    const token = jwt.sign({ id: 1, username: 'johndoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
    .patch('/api/users/edit/2')
    .send({
      username: "Gary"
    })
    .set('Authorization', `Bearer ${token}`)
    .expect(403)
    .then(({body}) => {
      expect(body.msg).toBe('Forbidden: Your security tokens do not match')
    })
  })

  it('should make a user a community member', () => {
    const token = jwt.sign({ id: 1, username: 'johndoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
    .post('/api/users/community/join')
    .send({
      user_id: 1,
      community_id: 2,
    })
    .set('Authorization', `Bearer ${token}`)
    .expect(201)
    .then(({body}) => {
      expect(body.msg).toBe("Successfully joined community")
      expect(body.community.community_id).toBe(2)
    })
  })
  it('should remove a user as a community member', () => {
    const token = jwt.sign({ id: 3, username: 'sarahsmith' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
    .delete('/api/users/community/leave/1/3')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .then(({body}) => {
      expect(body.msg).toBe("Successfully left the community")
    })
  })
  it('should add user as group member', () => {
    const token = jwt.sign({ id: 2, username: 'janedoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
    .post('/api/users/group/join')
    .send({
      user_id: 2,
      group_id: 5,
    })
    .set('Authorization', `Bearer ${token}`)
    .expect(201)
    .then(({body}) => {
      expect(body.msg).toBe("Successfully joined group")
      expect(body.group.group_id).toBe(5)
    })
  })
  it('should remove a user as a group member', () => {
    const token = jwt.sign({ id: 2, username: 'sarahsmith' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
    .delete('/api/users/group/leave/1/2')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .then(({body}) => {
      expect(body.msg).toBe("Successfully left the group")
    })
  })
})

describe('User Registration, Login, Forgot Password and Verification Tests', () => {
  it('should register a user, send a verification email, and verify the user email', () => {
    return request(app)
      .post('/api/users/register')
      .send({
        username: 'ambass01',
        password: 'pipedr3ams',
        email: 'hoot@hoot.hoot'
      })
      .expect(201)
      .then(({ body }) => {
        expect(body.msg).toBe('User registered successfully. Please check your email to verify your account.');

        // Simulate receiving the token (in a real test, this would come from the email)
        const verificationToken = jwt.sign({ email: 'hoot@hoot.hoot' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return request(app)
          .get(`/api/users/verify-email?token=${verificationToken}`)
          .expect(200);
      })
      .then(({ body }) => {
        expect(body.msg).toBe('Email verified successfully. Your account is now active.');
      });
  });

  it("200 returns a user by their user name assuming the password is correct", () => {
    return request(app)
      .post('/api/users/login')
      .send({
        username:"janedoe",
        password:"JaneDoe456"
      })
      .expect(200)
      .then(({ body }) => {
        const user = body.user;
        const token = body.token
        expect(user.username).toBe("janedoe");
        expect(user.user_bio).toBe("Lover of books, coffee, and exploring new places. Excited to connect with fellow bookworms and discover hidden gems in the community.");
        expect(user.user_avatar).toBe(
          "https://example.com/avatar_janedoe.jpg"
        );
        expect(token).toBeDefined();

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        expect(decoded.id).toBe(user.user_id);
        expect(decoded.username).toBe(user.username);
      });
  });
  it("400 incorrect password message", () => {
    return request(app)
      .post('/api/users/login')
      .send({
        username:"janedoe",
        password:"froggy"
      })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Passwords do not match. Please try again.");
      });
  });
  it("404 user not found", () => {
    return request(app)
      .post('/api/users/login')
      .send({
        username:"janeboe",
        password:"JaneDoe456"
      })
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("User not found");
      });
  });
  it("200 returns a user by email address", () => {
    return request(app)
      .post('/api/users/login')
      .send({
        username:"sarahsmith@example.com",
        password:"RunnerGirl789"
      })
      .expect(200)
      .then(({ body }) => {
        const user = body.user;
        expect(user.username).toBe("sarahsmith");
        expect(user.user_bio).toBe("Dedicated runner and fitness enthusiast. Always up for a challenge and looking to join group runs in the local area.");
        expect(user.user_avatar).toBe(
          "https://example.com/avatar_sarahsmith.jpg"
        );
      });
  });
  it("400 incorrect password message - EMAIL", () => {
    return request(app)
      .post('/api/users/login')
      .send({
        username:"sarahsmith@example.com",
        password:"RunnerGirl779"
      })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Passwords do not match. Please try again.");
      });
  });
  it("404 user not found - EMAIL", () => {
    return request(app)
      .post('/api/users/login')
      .send({
        username:"sarahsmith@example.con",
        password:"RunnerGirl779"
      })
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("User not found");
      });
  });

  it('should let a user request an email to reset their password', () => {
    return request(app)
      .post('/api/users/forgot-password')
      .send({
        email: 'johndoe@example.com'
      })
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe('Please check your email to change your password.');

        // Simulate receiving the token (in a real test, this would come from the email)
        const verificationToken = jwt.sign({ email: 'johndoe@example.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return request(app)
          .post(`/api/users/update-password?token=${verificationToken}`)
          .send({
            password:'password321'
          })
          .expect(201);
      })
      .then(({ body }) => {
        expect(body.msg).toBe('You password has been changed successfully.');
        return db.query(`SELECT * FROM users WHERE user_email = $1`, ['johndoe@example.com']);
      })
        .then(({ rows }) => {
          const user = rows[0];
          return bcrypt.compare('password321', user.password)
            .then(isMatch => {
              expect(isMatch).toBe(true);
        });
      });
    })
  it('should reject a password change with an incorrect token', () => {
    return request(app)
      .post('/api/users/forgot-password')
      .send({
        email: 'johndoe@example.com'
      })
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toBe('Please check your email to change your password.');

        // Simulate receiving the token (in a real test, this would come from the email)
        const invalidToken = jwt.sign({ email: 'johndoe@example.com' }, 'invalid token', { expiresIn: '1h' });
        return request(app)
          .post(`/api/users/update-password?token=${invalidToken}`)
          .send({
            password:'password321'
          })
          .expect(400);
      })
      .then(({ body }) => {
        expect(body.msg).toBe('Error verifying user: JsonWebTokenError: invalid signature');
      });
  })
  it('should delete user with appropriate token', () => {
    token = jwt.sign({ id: 14, username: 'mattwilson' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
    .delete('/api/users/14')
    .set('Authorization', `Bearer ${token}`)
    .send({
      username:'mattwilson'
    })
    .expect(200)
    .then(({body}) => {
      expect(body.msg).toBe('User deleted.')
    })
    .then(() => {
      return db.query(`
      SELECT user_id, username FROM USERS`)
    })
    .then(({rows}) => {
      expect(rows.length).toBe(13)
    })
  })
});


describe('Posts', () => {
  it('should respond with the posts based on a user ID', () => {
    return request(app)
      .get('/api/posts/user/1')
      .expect(200)
      .then(({body}) => {
        expect(body.posts.length).toBe(14)
      })
  })
  it('should respond with posts filtered by groups', () => {
    return request(app)
    .get('/api/posts/user/1?filter=groups')
    .expect(200)
    .then(({body}) => {
      body.posts.map((post) => {
        expect(post.group_id > 0).toBe(true)
        expect(!post.church_id).toBe(true)
        expect(!post.school_id).toBe(true)
        expect(!post.business_id).toBe(true)
      })
    })
  })
  it('should respond with posts filtered by churches', () => {
    return request(app)
    .get('/api/posts/user/1?filter=churches')
    .expect(200)
    .then(({body}) => {
      body.posts.map((post) => {
        expect(!post.group_id).toBe(true)
        expect(!post.church_id).toBe(false)
        expect(!post.school_id).toBe(true)
        expect(!post.business_id).toBe(true)
      })
    })
  })
  it('should include business posts in the default view', () => {
    return request(app)
    .get('/api/posts/user/1')
    .expect(200)
    .then(({body}) => {
      const businessPosts = body.posts.filter((post)=> {
        if(post.business_id > 0) {
          return post
        }
      })
      expect(businessPosts.length).toBe(2)
    })
  })
  it('should return a single post based on the ID', () => {
    return request(app)
    .get('/api/posts/12')
    .expect(200)
    .then(({body}) => {
      expect(body.post[0].post_id).toBe(12)
      expect(body.post[0].post_title).toBe('New menu at The Cozy Café')
      expect(body.post[0].post_img).toBe('https://example.com/cozy_cafe_menu.jpg')
    })
  })
  it('should return the post data as well as associated comments', () => {
    return request(app)
    .get('/api/posts/12')
    .expect(200)
    .then(({body}) => {
      expect(body.post[0].post_id).toBe(12)
      expect(body.post[0].post_title).toBe('New menu at The Cozy Café')
      expect(body.post[0].post_img).toBe('https://example.com/cozy_cafe_menu.jpg')
      expect(body.comments[0].comment_title).toBe("Looking forward to it!")
      expect(body.comments.length).toBe(2)
    })
  })
  it('should add a new post tagged with the relevant group, school etc', () => {
    const token = jwt.sign({ id: 1, username: 'johndoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
    .post('/api/posts')
    .send({
      post_title: "Summer Book Sale",
      post_description: "All books £1 or less. Send your kids in with cash to take advantage of this great offer.",
      post_location: "Sunshine Primary School",
      post_img: "https://wordsrated.com/wp-content/uploads/2022/02/books-g24d0ae1ed_1920.jpg",
      pdf_link: null,
      pdf_title: null,
      author: 1,
      church_id:null,
      school_id:2,
      business_id:null,
      group_id:null,
    })
    .set('Authorization', `Bearer ${token}`)
    .expect(201)
    .then(({body}) => {
      expect(body.newPost.post_title).toBe("Summer Book Sale")
      expect(body.newPost.post_description).toBe("All books £1 or less. Send your kids in with cash to take advantage of this great offer.")
      expect(body.newPost.post_location).toBe("Sunshine Primary School")
    })
  })
})

describe('Businesses', () => {
  it('should respond with the business by ID along with the associated posts', () => {
    return request(app)
      .get('/api/businesses/5')
      .expect(200)
      .then(({body}) => {
        expect(body.business.business_name).toBe("Brick by Brick Construction")
        expect(body.posts.length).toBe(1)
      })
  })
  it('should add a new business, returning the business details', () => {
    const token = jwt.sign({ id: 1, username: 'johndoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
      .post('/api/businesses/1/1')
      .set('Authorization', `Bearer ${token}`)
      .send({
        business_name: "Cath's Cafe",
        business_bio: "Always fresh, always tasty. Sit in or takeaway cafe.",
        business_email: "cath@cathscafe.com",
        business_website: "https://cathscafe.com",
        business_img: "https://media-cdn.tripadvisor.com/media/photo-s/0d/36/b6/9a/traditional-english-breakfast.jpg",
        community_id:1,
      })
      .expect(201)
      .then(({body}) => {
        expect(body.newBusiness.business_name).toBe("Cath's Cafe")
        expect(body.newBusiness.business_bio).toBe("Always fresh, always tasty. Sit in or takeaway cafe.")
      })
      .then(() => {
        return db.query(`SELECT * FROM businesses`)
      })
      .then(({rows}) => {
        expect(rows.length).toBe(7)
      })
      .then(() => {
        return db.query(`SELECT * FROM business_owners_junction`)
      })
      .then(({rows}) => {
        expect(rows.length).toBe(6)
        expect(rows[5].business_id).toBe(7)
      })
  })
  it('should Patch / Edit a business is the user owns it', () => {
    const token = jwt.sign({ id: 1, username: 'johndoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
    .patch('/api/businesses/edit/3/1')
    .send({
      business_name: "Clear Windows",
      business_bio: "PVC windows. 24 year warranty. Pay in cash. No tax."
    })
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .then(({body}) => {
      expect(body.business.business_name).toBe("Clear Windows")
      expect(body.business.business_bio).toBe("PVC windows. 24 year warranty. Pay in cash. No tax.")
    })
  })
})

describe('Groups', () => {
  it('should respond with a group by ID along with the associated posts', () => {
    return request(app)
      .get('/api/groups/1')
      .expect(200)
      .then(({body}) => {
        expect(body.group.group_name).toBe("Young Kickers Football Club")
        expect(body.posts.length).toBe(1)
      })
  })

  it('should add a new group, returning the group details', () => {
    const token = jwt.sign({ id: 1, username: 'johndoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return request(app)
      .post('/api/groups/1/1')
      .send({
        group_name: "Walkers Club",
        group_bio: "A walking group meeting up once a month for a walk.",
        group_img: "https://experiencelife.lifetime.life/wp-content/uploads/2023/02/apr23-feat-born-to-walk.jpg",
        community_id:1,
      })
      .set('Authorization', `Bearer ${token}`)

      .expect(201)
      .then(({body}) => {
        expect(body.newGroup.group_name).toBe("Walkers Club")
        expect(body.newGroup.group_bio).toBe("A walking group meeting up once a month for a walk.")
      })
      .then(() => {
        return db.query(`SELECT * FROM groups`)
      })
      .then(({rows}) => {
        expect(rows.length).toBe(7)
      })
      .then(() => {
        return db.query(`SELECT * FROM group_admins`)
      })
      .then(({rows}) => {
        expect(rows.length).toBe(7)
        expect(rows[6].group_id).toBe(7)
      })
      .then(() => {
        return db.query(`SELECT user_id FROM group_members`)
      })
      .then(({rows}) => {
        expect(rows.length).toBe(19)
      })
  })

  it('should Patch / Edit a group if the user owns it', () => {
    const token = jwt.sign({ id: 1, username: 'johndoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
    .patch('/api/groups/edit/1/1')
    .send({
      group_name: "5-14 Kids Football - Young Kickers",
    })
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .then(({body}) => {
      expect(body.group.group_name).toBe("5-14 Kids Football - Young Kickers")
      expect(body.group.group_bio).toBe("Young Kickers Football Club is a community-based club dedicated to providing football training and matches for children aged 7 to 16. Our aim is to develop skills, teamwork, and a love for the game in a fun and supportive environment.")
    })
  })
})

describe('Schools', () => {
  const token = jwt.sign({ id: 1, username: 'johndoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  it('should respond with a school by ID along with the associated posts', () => {
    return request(app)
      .get('/api/schools/1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .then(({body}) => {
        expect(body.school.school_name).toBe("Little Sprouts Nursery")
        expect(body.posts.length).toBe(1)
      })
  })
  it('should add a new school, returning the school details', () => {
    const token = jwt.sign({ id: 1, username: 'johndoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
      .post('/api/schools/1/1')
      .send({
        school_name: "All Saints Prep School",
        school_bio: "Prepare your children in the best possible way. All Saints nurtures young minds.",
        school_email: "admin@school.com",
        school_website: "https://www.school.com",
        school_phone: "01234 5678910",
        school_img: "https://upload.wikimedia.org/wikipedia/commons/f/f1/School-education-learning-1750587-h.jpg",
        community_id:1,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201)
      .then(({body}) => {
        expect(body.newSchool.school_name).toBe("All Saints Prep School")
        expect(body.newSchool.school_bio).toBe("Prepare your children in the best possible way. All Saints nurtures young minds.")
      })
      .then(() => {
        return db.query(`SELECT * FROM schools`)
      })
      .then(({rows}) => {
        expect(rows.length).toBe(3)
      })
      .then(() => {
        return db.query(`
          SELECT * FROM school_owners_junction
          WHERE school_owner_junction_id = 2`)
      })
      .then(({rows}) => {
        expect(rows[0].school_id).toBe(3)
      })
      .then(() => {
        return db.query(`
          SELECT user_id FROM school_parents_junction`)
      })
      .then(({rows}) => {
        expect(rows.length).toBe(6)
      })
  })
  it('should Patch / Edit a school if the user owns it', () => {
    const token = jwt.sign({ id: 1, username: 'johndoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
    .patch('/api/schools/edit/2/1')
    .send({
      school_website: "www.sunshineschool.edu",
    })
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .then(({body}) => {
      expect(body.school.school_name).toBe("Sunshine Primary School")
      expect(body.school.school_website).toBe("www.sunshineschool.edu")
    })
  })
})

describe('Churches', () => {
  it('should respond with a church by ID along with the associated posts', () => {
    return request(app)
      .get('/api/churches/1')
      .expect(200)
      .then(({body}) => {
        expect(body.church.church_name).toBe("St. Paul's Methodist Church")
        expect(body.posts.length).toBe(1)
      })
  })
  it('should add a new church, returning the church details', () => {
    const token = jwt.sign({ id: 3, username: 'sarahsmith' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return request(app)
      .post('/api/churches/1/3')
      .send({
        church_name: "Crazy Church",
        church_bio: "We are the descendants of the lizard people.",
        church_email: "admin@crazychurch.com",
        church_website: "https://www.crazychurch.com",
        church_img: "https://upload.wikimedia.org/wikipedia/commons/f/f1/School-education-learning-1750587-h.jpg",
        community_id:1,
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(201)
      .then(({body}) => {
        expect(body.newChurch.church_name).toBe("Crazy Church")
        expect(body.newChurch.church_bio).toBe("We are the descendants of the lizard people.")
      })
      .then(() => {
        return db.query(`SELECT * FROM churches`)
      })
      .then(({rows}) => {
        expect(rows.length).toBe(3)
      })
      .then(() => {
        return db.query(`
        SELECT * FROM church_owners_junction
        WHERE church_owner_junction_id = 2`)
      })
      .then(({rows}) => {
        expect(rows[0].user_id).toBe(3)
        expect(rows[0].church_id).toBe(3)
      })
      .then(() => {
        return db.query(`
        SELECT user_id FROM church_members`)
      })
      .then(({rows}) => {
        expect(rows.length).toBe(6)
      })
  })

  it('should Patch / Edit a church if the user owns it', () => {
    const token = jwt.sign({ id: 1, username: 'johndoe' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return request(app)
    .patch('/api/churches/edit/1/1')
    .send({
      church_email: "info@stpauls.com",
      church_website: "https://www.stpauls.com"
    })
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .then(({body}) => {
      expect(body.church.church_name).toBe("St. Paul's Methodist Church")
      expect(body.church.church_website).toBe("https://www.stpauls.com")
      expect(body.church.church_email).toBe("info@stpauls.com")
    })
  })
})