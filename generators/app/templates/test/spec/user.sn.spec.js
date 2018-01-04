/**
 * Created by vedi on 08/07/16.
 */

'use strict';

const _ = require('lodash');
const chakram = require('chakram');

const config = require('test/config');
const userSnData = require('test/data/user-sn.data');
const specHelper = require('test/spec-helper');

const { expect } = chakram;

describe('User SN', () => {
  const fb1 = userSnData.facebook[0];
  const fb2 = userSnData.facebook[1];
  const twitter = userSnData.twitter[0];
  const noEmailUser = userSnData.twitter[1];
  const google = userSnData.google[0];
  const fbUser1 = {};
  const fbUser2 = {};
  const twUser1 = {};

  describe('Sign In new user', () => {
    let response;

    before('send post', () => chakram
      .post(`${config.baseUrl}/api/users/snAuth/facebook`, Object.assign({}, fb1, specHelper.getClientAuth()))
      .then((result) => {
        response = result;
      }));

    before('get user profile', () => {
      fbUser1.auth = response.body;
      return specHelper
        .getUser(fbUser1, fbUser1, 'me')
        .then((result) => {
          Object.assign(fbUser1, _.pick(result, 'username', 'name'));
        });
    });

    it('should return status 200', () => expect(response).to.have.status(200));

    it('access_token should exist', () => expect(response.body.access_token).to.exist);

    it('should have same username', () => {
      expect(fbUser1.username).to.be.equal(fb1.auth.email);
    });

    it('should have same name', () => {
      expect(fbUser1.name).to.be.equal(fb1.auth.name);
    });
  });

  describe('Sign In with the same data', () => {
    let response;
    const tmpUser = {};

    before('send post', () => chakram
      .post(`${config.baseUrl}/api/users/snAuth/facebook`, Object.assign({}, fb1, specHelper.getClientAuth()))
      .then((result) => {
        response = result;
      }));

    before('get user profile', () => {
      tmpUser.auth = response.body;
      fbUser1.auth = response.body;
      return specHelper
        .getUser(tmpUser, tmpUser, 'me')
        .then((result) => {
          Object.assign(tmpUser, _.pick(result, 'username', 'name'));
        });
    });

    it('should return status 200', () => expect(response).to.have.status(200));

    it('should have the same user _id', () => expect(response.body.access_token).to.exist);
  });

  describe('Sign In with other sn but the same email', () => {
    let response;

    before('send post', () => {
      const userData = Object.assign({}, google, specHelper.getClientAuth());
      userData.auth.email = fbUser1.username;
      return chakram
        .post(`${config.baseUrl}/api/users/snAuth/google`, userData)
        .then((result) => {
          response = result;
        });
    });

    it('should return status 400', () => expect(response).to.have.status(400));
  });

  describe('Sign in with no email', () => {
    let response;

    before('send post', () => chakram
      .post(`${config.baseUrl}/api/users/snAuth/twitter`, Object.assign({}, noEmailUser, specHelper.getClientAuth()))
      .then((result) => {
        response = result;
      }));

    it('should return status 400', () => expect(response).to.have.status(400));
  });

  describe('Link another sn', () => {
    let response;

    before('send post', () => chakram
      .put(
        `${config.baseUrl}/api/users/me/linked-accounts/twitter`,
        twitter,
        { headers: { Authorization: `Bearer ${fbUser1.auth.access_token}` } }
      )
      .then((result) => {
        response = result;
      }));

    it('should return status 204', () => expect(response).to.have.status(204));
  });

  describe('Link same sn second time to other user', () => {
    let response;

    before('Sign In secondary user', () => specHelper
      .signInSocial('facebook', fb2, fbUser2)
      .then(() => specHelper.getUser(fbUser2, fbUser2, 'me'))
      .then((result) => {
        Object.assign(fbUser2, _.pick(result, 'username', 'name'));
      }));

    before('send post', () => chakram
      .put(
        `${config.baseUrl}/api/users/me/linked-accounts/twitter`,
        twitter,
        { headers: { Authorization: `Bearer ${fbUser2.auth.access_token}` } }
      )
      .then((result) => {
        response = result;
      }));

    it('should return status 400', () => expect(response).to.have.status(400));
  });

  describe('Sign In with linked sn', () => {
    let response;

    before('send post', () => chakram
      .post(`${config.baseUrl}/api/users/snAuth/twitter`,
        Object.assign({}, twitter, specHelper.getClientAuth()))
      .then((result) => {
        response = result;
      }));

    before('get user profile', () => {
      twUser1.auth = response.body;
      fbUser1.auth = response.body;
      return specHelper
        .getUser(twUser1, twUser1, 'me')
        .then((result) => {
          Object.assign(twUser1, _.pick(result, 'username', 'name'));
        });
    });

    it('should return status 200', () => expect(response).to.have.status(200));

    it('should have the same user _id', () => expect(twUser1._id).to.be.equal(fbUser1._id));
  });

  describe('Unlink another sn', () => {
    let response;

    before('send post', () => chakram
      .delete(`${config.baseUrl}/api/users/me/linked-accounts/twitter`,
        twitter,
        { headers: { Authorization: `Bearer ${fbUser1.auth.access_token}` } }
      )
      .then((result) => {
        response = result;
      }));

    it('should return status 204', () => expect(response).to.have.status(204));
  });

  after('remove fbUser1', () => specHelper.removeUser(fbUser1));

  after('remove fbUser2', () => specHelper.removeUser(fbUser2));

  after('remove noEmailUser', () => specHelper.removeUser(noEmailUser));
});
