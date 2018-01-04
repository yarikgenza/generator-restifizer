/**
 * Created by vedi on 08/07/16.
 */

'use strict';

const moment = require('moment');
const chakram = require('chakram');

const testConfig = require('test/config');
const { modelProvider: { User } } = require('app/app');
const specHelper = require('test/spec-helper');

const { expect } = chakram;

describe('User Email Verification', () => {
  const user = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);
  const stranger = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);
  const otherUser = specHelper.getFixture(specHelper.FIXTURE_TYPES.USER);
  const password = 'password';

  before('clear emails', () => specHelper.fetchAndClearSentEmails());

  describe('Create user', () => {
    before('create user', () => specHelper.createUser(user));

    it('user.emailVerified should be false', () => expect(user.emailVerified).not.to.be.true);

    it('user.emailVerification should exist', () => User
      .findOne({ _id: user._id }, 'emailVerification')
      .then(result => expect(result.emailVerification.token).to.be.exist));

    it('should have sent verification email', async () => {
      const letters = await specHelper.fetchAndClearSentEmails();

      return expect(letters.length).to.be.equal(1);
    });
  });

  describe('Verify email', () => {
    let token;
    const basicHeaders = { Authorization: `Basic ${specHelper.getBasicAuth()}` };
    const checkTokenUrl = `${testConfig.baseUrl}/api/users/check-verification-token`;
    const body = Object.assign(specHelper.getClientAuth(), { password });

    before('get valid token', async () => {
      const { emailVerification: { token: validToken } } = await User.findById({ _id: user._id });

      token = validToken;
      return token;
    });

    describe('by invalid token', () => {
      let response;
      let checkTokenResponse;

      before('check token', async () => {
        checkTokenResponse = await chakram.get(`${checkTokenUrl}/badtoken`, { headers: basicHeaders });
      });

      it('should check token correctly', () => {
        expect(checkTokenResponse).to.have.status(400);
      });

      before('send request', async () => {
        response = await chakram.post(`${testConfig.baseUrl}/api/users/verify-email/badtoken`, body);
      });

      it('should return status 400', () => {
        expect(response).to.have.status(400);
      });
    });

    describe('by expired token', () => {
      let response;
      let checkTokenResponse;

      before('make token expired', () => User.update(
        { _id: user._id },
        { $set: { 'emailVerification.expires': new Date('01/01/2000') } }
      ));

      before('check token', async () => {
        checkTokenResponse = await chakram.get(`${checkTokenUrl}/${token}`, { headers: basicHeaders });
      });

      it('should check token correctly', () => {
        expect(checkTokenResponse).to.have.status(400);
      });

      before('send request', async () => {
        response = await chakram
          .post(
            `${testConfig.baseUrl}/api/users/verify-email/${token}`,
            body
          );
      });

      it('should return status 400', () => {
        expect(response).to.have.status(400);
      });
    });

    describe('without password', () => {
      let response;

      before('make token valid', () => {
        const validDate = moment().add(1, 'h');

        return User.update(
          { _id: user._id },
          { $set: { 'emailVerification.expires': validDate } }
        );
      });

      before('send request', async () => {
        response = await chakram.post(
          `${testConfig.baseUrl}/api/users/verify-email/${token}`,
          specHelper.getClientAuth()
        );
      });

      it('should return status 400', () => {
        expect(response).to.have.status(400);
      });
    });

    describe('by valid token', () => {
      let response;
      let checkTokenResponse;

      before('make token valid', () => {
        const validDate = moment().add(1, 'h');

        return User.update(
          { _id: user._id },
          { $set: { 'emailVerification.expires': validDate } }
        );
      });

      before('check token', async () => {
        checkTokenResponse = await chakram.get(`${checkTokenUrl}/${token}`, { headers: basicHeaders });
      });

      it('should check token correctly', () => expect(checkTokenResponse).to.have.status(204));

      before('send request', async () => {
        response = await chakram
          .post(
            `${testConfig.baseUrl}/api/users/verify-email/${token}`,
            body
          );

        user.password = password;
      });

      it('should return status 200', () => expect(response).to.have.status(200));

      it('should return auth data', () => expect(response).to.be.authResponse);
    });
  });

  describe('Request email verification', () => {
    const body = specHelper.getClientAuth();

    describe('without username', () => {
      let response;

      before('send request', async () => {
        response = await chakram
          .put(`${testConfig.baseUrl}/api/users/register-or-verify/`, body);
      });

      it('should return status 401', () => {
        expect(response).to.have.status(401);
      });
    });

    describe('by verified user', () => {
      let response;

      before('send request', async () => {
        response = await chakram
          .put(`${testConfig.baseUrl}/api/users/register-or-verify/${user.username}`, body);
      });

      it('should return status 400', () => {
        expect(response).to.have.status(400);
      });
    });

    describe('by stranger', () => {
      let response;

      before('send request', async () => {
        response = await chakram
          .put(`${testConfig.baseUrl}/api/users/register-or-verify/${stranger.username}`, body);
      });

      it('should return status 201', () => {
        expect(response).to.have.status(201);
      });
    });

    describe('by unverified registered user', () => {
      let response;

      before('register user', () => specHelper.createUser(otherUser));

      before('send request', async () => {
        response = await chakram
          .put(`${testConfig.baseUrl}/api/users/register-or-verify/${otherUser.username}`, body);
      });

      it('should return status 200', () => {
        expect(response).to.have.status(200);
      });
    });
  });

  after('remove user', () => specHelper.removeUser(user));
  after('remove stranger', () => specHelper.removeUser(stranger));
  after('remove otherUser', () => specHelper.removeUser(otherUser));
});
