const { assert } = require('chai');

const { getUserByEmail, urlsForUser } = require('../helpers');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(user.id, expectedUserID, 'Expect match user ID');
  });

  it('should return undefined when looking for a non-existent email', () => {
    const user = getUserByEmail("abcd@example.com", testUsers);
    assert.strictEqual(user, undefined);
  });
});


const testUrls = {
  'abcd': {
    longURL: 'http://www.google.com',
    userID: 'mike'
  },
  'efgh': {
    longURL: 'http://www.reddit.com',
    userID: 'john'
  },
  'ijkl': {
    longURL: 'http://www.youtube.com',
    userID: 'daniel'
  }
};

describe('#urlsForUser', () => {
  it('should return the corresponding urls for a valid user', () => {
    const userUrls = urlsForUser('mike', testUrls);
    const expectedResult = {
      'abcd': {
        longURL: 'http://www.google.com',
        userID: 'mike'
      },
    };

    assert.deepEqual(userUrls, expectedResult);
  });

  it('should return an empty object for a non-existent user', () => {
    const userUrls = urlsForUser('amy', testUrls);
    assert.deepEqual(userUrls, {});
  });
});