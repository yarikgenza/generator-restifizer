/**
 * Created by vedi on 08/07/16.
 */

'use strict';

const _ = require('lodash');
const chakram = require('chakram');
const { modelProvider: { User } } = require('app/app');
const testConfig = require('test/config');
const specHelper = require('test/spec-helper');

const { expect } = chakram;

describe('User Auth', () => {
  const user = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);
  const otherUser = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);
  before('create user', () => specHelper.createVerifiedUser(user));
  before('create otherUser', () => specHelper.createVerifiedUser(otherUser));
  before('cleaning up emails', () => specHelper.fetchAndClearSentEmails());
  describe('Sign in', () => {
    let response;
    before('send post', () => chakram
      .post(
        `${testConfig.baseUrl}/oauth`,
        Object.assign({
          grant_type: 'password',
        }, _.pick(user, 'username', 'password'), specHelper.getClientAuth())
      )
      .then((result) => {
        response = result;
      }));


    it('should return status 200', () => {
      user.auth = _.pick(response.body, 'access_token', 'refresh_token');
      return expect(response).to.be.authResponse;
    });

    after('sign in otherUser', () => specHelper.signInUser(otherUser));
  });
  describe('Logout', () => {
    let response;
    before('send request', () => chakram
      .post(
        `${testConfig.baseUrl}/api/users/logout`,
        {},
        { headers: { Authorization: `Bearer ${user.auth.access_token}` } }
      )
      .then((result) => {
        response = result;
      }));
    it('should return status 204', () => expect(response).to.have.status(204));
    after('sign in user', () => specHelper.signInUser(user));
  });
  describe('Change password', () => {
    let response;
    before('send request', () => {
      const newPassword = 'newPassword';
      return chakram
        .post(
          `${testConfig.baseUrl}/api/users/me/change-password`,
          { password: user.password, newPassword },
          { headers: { Authorization: `Bearer ${user.auth.access_token}` } }
        )
        .then((result) => {
          response = result;
          user.password = newPassword;
        });
    });
    before('sign in with new password', () =>
      // we are not checking result as it just will crash in this place, if it's not able to sign in
      specHelper.signInUser(user));
    it('should return status 204', () => expect(response).to.have.status(204));
  });
  describe('Change password by other user', () => {
    let response;
    before('send request', () => {
      const newPassword = 'anotherNewPassword';
      return chakram
        .post(
          `${testConfig.baseUrl}/api/users/${user._id}/change-password`,
          { password: user.password, newPassword },
          { headers: { Authorization: `Bearer ${otherUser.auth.access_token}` } }
        )
        .then((result) => {
          response = result;
        });
    });
    it('should return status 400', () => expect(response).to.have.status(400));
  });
  describe('Forgot password for not existing user', () => {
    let response;
    before('send request', () => chakram
      .post(
        `${testConfig.baseUrl}/api/users/forgot`,
        Object.assign(specHelper.getClientAuth(), { username: 'someFakeUserName' })
      )
      .then((result) => {
        response = result;
      }));
    it('should return status 400', () => expect(response).to.have.status(400));
  });
  describe('Forgot password', () => {
    let response;
    let userDoc;
    let sentEmails;
    before('send request', () => chakram
      .post(
        `${testConfig.baseUrl}/api/users/forgot`,
        Object.assign(specHelper.getClientAuth(), { username: user.username })
      )
      .then((result) => {
        response = result;
      }));
    before('wait event processing', (done) => {
      setTimeout(done, 500);
    });
    before('fetch user from db', () => User
      .findOne({ _id: user._id }).select('resetPassword').lean().exec()
      .then((result) => {
        userDoc = result;
      }));
    before('send request', () => specHelper
      .fetchAndClearSentEmails()
      .then((result) => {
        sentEmails = result;
      }));
    it('should return status 204', () => expect(response).to.have.status(204));
    it('should set reset token for user in db', () => expect(userDoc.resetPassword.token).to.exist);
    it('should contain 1 email', () => expect(sentEmails.length).to.be.equal(1));
    it('email should be sent to this user', () => expect(sentEmails[0].to).to.be.equal(user.username.toLowerCase()));
    it('email should contain reset token of to this user', () => {
      user.resetPassword = userDoc.resetPassword;
      return expect(sentEmails[0].html.indexOf(user.resetPassword.token)).to.be.above(-1);
    });
  });

  describe('Reset password with empty newPassword', () => {
    let response;
    before('send request', () => {
      user.password = 'completelyOtherPassword';
      return chakram
        .post(
          `${testConfig.baseUrl}/api/users/reset/${user.resetPassword.token}`,
          Object.assign(specHelper.getClientAuth(), { password: user.password })
        )
        .then((result) => {
          response = result;
        });
    });
    it('should return status 400', () => expect(response).to.have.status(400));
  });

  describe('Reset password', () => {
    let response;
    let sentEmails;
    before('send request', () => {
      user.password = 'completelyOtherPassword';
      return chakram
        .post(
          `${testConfig.baseUrl}/api/users/reset/${user.resetPassword.token}`,
          Object.assign(specHelper.getClientAuth(), { newPassword: user.password })
        )
        .then((result) => {
          response = result;
        });
    });
    before('wait event processing', (done) => {
      setTimeout(done, 500);
    });
    before('send request', () => specHelper
      .fetchAndClearSentEmails()
      .then((result) => {
        sentEmails = result;
      }));
    it('should return auth data', () => expect(response).to.be.authResponse);
    before('sign in with new password', () =>
      // we are not checking result as it just will crash in this place, if it's not able to sign in
      specHelper.signInUser(user));
    it('should contain 1 email', () => expect(sentEmails.length).to.be.equal(1));
  });
  describe('Reset password using the same token', () => {
    let response;
    before('send request', () => {
      user.password = 'completelyOtherPassword';
      return chakram
        .post(
          `${testConfig.baseUrl}/api/users/reset/${user.resetPassword.token}`,
          Object.assign(specHelper.getClientAuth(), { newPassword: user.password })
        )
        .then((result) => {
          response = result;
        });
    });
    it('should return status 400', () => expect(response).to.have.status(400));
  });
  describe('Reset password using random token', () => {
    let response;
    before('send request', () => {
      user.password = 'completelyOtherPassword';
      return chakram
        .post(
          `${testConfig.baseUrl}/api/users/reset/someRandomValue`,
          Object.assign(specHelper.getClientAuth(), { newPassword: user.password })
        )
        .then((result) => {
          response = result;
        });
    });
    it('should return status 400', () => expect(response).to.have.status(400));
  });
  after('remove user', () => specHelper.removeUser(user));
  after('remove otherUser', () => specHelper.removeUser(otherUser));
});
