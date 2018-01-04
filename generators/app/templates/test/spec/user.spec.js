/**
 * Created by vedi on 08/07/16.
 */

'use strict';

const chakram = require('chakram');

const testConfig = require('test/config');
const specHelper = require('test/spec-helper');

const { expect } = chakram;

describe('User', () => {
  const user = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);
  const otherUser = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);

  describe('Sign up', () => {
    let response;

    before('send post', () => chakram
      .put(
        `${testConfig.baseUrl}/api/users/register-or-verify/${user.username}`,
        specHelper.getClientAuth()
      )
      .then((result) => {
        response = result;
      }));

    it('should return status 201', () => expect(response).to.have.status(201));

    it('should contain _id', () => {
      user._id = response.body._id;
      return expect(response.body._id).to.exist;
    });

    after('send post', () => specHelper.verifyUser(user));
    after('send post', () => specHelper.signInUser(user));
  });

  describe('Get user list', () => {
    let response;

    before('create and sign in otherUser', () => specHelper
      .createVerifiedUser(otherUser)
      .then(() => specHelper.signInUser(otherUser)));

    before('send post', () => chakram
      .get(
        `${testConfig.baseUrl}/users`,
        { headers: { Authorization: `Bearer ${user.auth.access_token}` } }
      )
      .then((result) => {
        response = result;
      }));

    it('should return status 404', () => {
      expect(response).to.have.status(404);
    });
  });

  describe('Get Profile', () => {
    let response;

    before('send request', () => chakram
      .get(
        `${testConfig.baseUrl}/api/users/me`,
        { headers: { Authorization: `Bearer ${user.auth.access_token}` } }
      )
      .then((result) => {
        response = result;
      }));

    it('should return status 200', () => {
      expect(response).to.have.status(200);
    });

    it('should be the same _id', () => {
      expect(response).to.have.json('_id', user._id);
    });

    it('should be the same username', () => {
      expect(response).to.have.json('username', user.username.toLowerCase());
    });
  });

  describe('Change Profile', () => {
    const NEW_VALUE = Object.assign({}, user.character, { name: 'Name' });

    let response;

    before('send request', () => chakram
      .patch(
        `${testConfig.baseUrl}/api/users/me`,
        { character: NEW_VALUE },
        { headers: { Authorization: `Bearer ${user.auth.access_token}` } }
      )
      .then((result) => {
        response = result;
      }));

    it('should return status 200', () => {
      expect(response).to.have.status(200);
    });

    it('should change gender', () => {
      expect(response).to.have.json('character', NEW_VALUE);
    });
  });

  describe('Remove Profile', () => {
    let response;

    before('send request', () => chakram
      .delete(
        `${testConfig.baseUrl}/api/users/me`,
        {},
        { headers: { Authorization: `Bearer ${user.auth.access_token}` } }
      )
      .then((result) => {
        response = result;
      }));

    it('should return status 204', () => {
      expect(response).to.have.status(204);
    });
  });

  after('remove user', () => specHelper.removeUser(user));

  after('remove otherUser', () => specHelper.removeUser(otherUser));
});
