const request = require("supertest");
const jwt = require('jsonwebtoken')
const { db } = require("../db/connection");

const app = require("../app.js");
const seed = require("../db/seeds/seed.js");
const testData = require("../db/data/test_data/index.js");

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
        expect(body.communities[0].member_count).toBe('14')
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
    return request(app)
      .post('/api/communities')
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
      .then(() => {
        return db.query(`
          SELECT * FROM users
          WHERE user_id = 2`)
      .then(({rows}) => {
        expect(rows[0].community_owner).toBe(6)
      })
      })
  })
  it('should reject a new community with an existing name', () => {
    return request(app)
      .post('/api/communities')
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
})


describe('Users', () => {
  it('should respond with the users data, based on their params', () => {
    return request(app)
      .get('/api/users/johndoe@example.com')
      .expect(200)
      .then(({body}) => {
        expect(body.user.username).toBe('johndoe')
      })
  })
  it('should respond 404 and a cannot find message for unfound users', () => {
    return request(app)
      .get('/api/users/this@email.com')
      .expect(404)
      .then(({body}) => {
        expect(body.msg).toBe("This user does not exist")
      })
  })
  it('should response with details of the schools, churches, groups and businesses associated with a user', () => {
    return request(app)
      .get('/api/users/johndoe@example.com')
      .expect(200)
      .then(({body}) => {
        expect(body.user.schools.length).toBe(2)
      })
  })
  it('should respond admin users groups, schools, businesses, and churches', () => {
    return request(app)
    .get('/api/users/1/manage')
    .expect(200)
    .then(({body}) => {
      expect(body.school.school_id).toBe(2)
      expect(body.businesses[0].business_id).toBe(3)
      expect(body.church.church_id).toBe(1)
      expect(body.groups[0].group_id).toBe(1)
    })
  })
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
        expect(decoded.id).toBe(user.id);
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
})

describe('User Registration and Verification Tests', () => {
  beforeEach(() => seed(testData)); // Reseed the database before each test

  it('should register a user, send a verification email, and verify the user email', () => {
    return request(app)
      .post('/api/users/register')
      .send({
        username: 'ambass01',
        password: 'pipedr3ams',
        email: 'oliverjamessmith26@hotmail.co.uk'
      })
      .expect(201)
      .then(({ body }) => {
        expect(body.msg).toBe('User registered successfully. Please check your email to verify your account.');

        // Simulate receiving the token (in a real test, this would come from the email)
        const verificationToken = jwt.sign({ email: 'oliverjamessmith26@hotmail.co.uk' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return request(app)
          .get(`/api/users/verify-email?token=${verificationToken}`)
          .expect(200);
      })
      .then(({ body }) => {
        expect(body.msg).toBe('Email verified successfully. Your account is now active.');
      });
  });
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
    return request(app)
      .post('/api/businesses/1/1')
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
    return request(app)
      .post('/api/groups/1/1')
      .send({
        group_name: "Walkers Club",
        group_bio: "A walking group meeting up once a month for a walk.",
        group_img: "https://experiencelife.lifetime.life/wp-content/uploads/2023/02/apr23-feat-born-to-walk.jpg",
        community_id:1,
      })
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
  })
})

describe('Schools', () => {
  it('should respond with a school by ID along with the associated posts', () => {
    return request(app)
      .get('/api/schools/1')
      .expect(200)
      .then(({body}) => {
        expect(body.school.school_name).toBe("Little Sprouts Nursery")
        expect(body.posts.length).toBe(1)
      })
  })
  it('should add a new school, returning the school details', () => {
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
          SELECT * FROM users
          WHERE user_id = 1`)
      })
      .then(({rows}) => {
        expect(rows[0].school_owner).toBe(3)
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
          SELECT * FROM users
          WHERE user_id = 3`)
      })
      .then(({rows}) => {
        expect(rows[0].church_owner).toBe(3)
      })
  })
})