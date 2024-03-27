const request = require("supertest");
const { db } = require("../db/connection");

const app = require("../app.js");
const seed = require("../db/seeds/seed.js");
const testData = require("../db/data/test_data/index.js");

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
})



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
})