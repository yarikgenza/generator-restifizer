/**
 * Created by vedi on 08/07/16.
 */

'use strict';

const chakram = require('chakram');

const testConfig = require('test/config');
const specHelper = require('test/spec-helper');

const expect = chakram.expect;

describe('User Public', () => {
  const user = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);
  const otherUser = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);

  before('create and authenticate user', () => specHelper.createVerifiedUser(user)
    .then(specHelper.signInUser.bind(specHelper, user)));

  before('create and authenticate otherUser', () => specHelper.createVerifiedUser(otherUser));

  describe('Get list', () => {
    let response;

    before('send request', () => chakram
      .get(`${testConfig.baseUrl}/api/users/public`,
      {
        headers: {
          Authorization: `Bearer ${user.auth.access_token}`,
        },
      })
      .then((result) => {
        response = result;
      }));

    it('should return status 200', () => {
      expect(response).to.have.status(200);
    });

    it('response should contain array', () => expect(response.body).to.be.instanceof(Array));
  });

  describe('Get otherUser\'s record', () => {
    let response;

    before('send request', () => chakram
      .get(`${testConfig.baseUrl}/api/users/${otherUser._id}/public`,
      {
        headers: {
          Authorization: `Bearer ${user.auth.access_token}`,
        },
      })
      .then((result) => {
        response = result;
      }));

    it('should return status 200', () => {
      expect(response).to.have.status(200);
    });

    it('should be the same _id', () => {
      expect(response).to.have.json('_id', otherUser._id);
    });
  });

  after('remove user', () => specHelper.removeUser(user));

  after('remove otherUser', () => specHelper.removeUser(otherUser));
});
