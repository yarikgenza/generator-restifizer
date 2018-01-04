/**
 * Created by vedi on 08/07/16.
 */

'use strict';

const _ = require('lodash');
const Bb = require('bluebird');
const request = require('request-promise');
const chakram = require('chakram');

const app = require('app/app');
const testConfig = require('test/config');

const io = require('socket.io-client');

const { modelProvider: { User, AccessToken, RefreshToken }, config } = app;

const FIXTURE_TYPES = {
  USER: 'user.data',
};

const clientAuth = {
  client_id: testConfig.client.id,
  client_secret: testConfig.client.secret,
};

const specHelper = {

  FIXTURE_TYPES,

  get(uri, options) {
    return this.request('GET', uri, undefined, options);
  },
  post(uri, body, options) {
    return this.request('POST', uri, body, options);
  },
  patch(uri, body, options) {
    return this.request('PATCH', uri, body, options);
  },
  put(uri, body, options) {
    return this.request('PUT', uri, body, options);
  },
  delete(uri, body, options) {
    return this.request('DELETE', uri, body, options);
  },
  request(method, uri, body, options) {
    options = Object.assign({
      method,
      uri,
      body,
      resolveWithFullResponse: true,
      // simple: false,
      json: true,
    }, options);
    return request(options);
  },

  connectToSocket(options) {
    options = options || {};
    return io.connect(testConfig.baseUrl, options);
  },

  getFixture(fixtureType, seed) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const fixtureProvider = require(`./data/${fixtureType}`);
    if (_.isArray(fixtureProvider)) {
      if (_.isUndefined(seed)) {
        seed = Math.floor(Math.random() * fixtureProvider.length);
      } else if (!_.isNumber(seed) || seed >= fixtureProvider.length) {
        throw new Error(`Wrong seed value: ${seed}`);
      }

      return Object.assign({}, fixtureProvider[seed]);
    } else if (_.isFunction(fixtureProvider)) {
      seed = seed || Math.floor(Math.random() * 1000000);
      return fixtureProvider(seed);
    } else {
      throw new Error(`Unsupported fixture provider: ${fixtureType}`);
    }
  },

  getClientAuth() {
    return Object.assign({}, clientAuth);
  },

  getBasicAuth(client) {
    const clientId = client ? client.clientId : clientAuth.client_id;
    const clientSecret = client ? client.clientSecret : clientAuth.client_secret;

    return Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  },

  getAdminUser() {
    return Object.assign({}, config.defaultUser);
  },

  runJob(name, data) {
    return this
      .post(
        `${testConfig.baseUrl}/jobs/${name}`,
        data
      );
  },

  fetchAndClearSentEmails() {
    return this
      .get(`${testConfig.baseUrl}/testing/sent-emails`)
      .then(result => result.body);
  },

  createUser(data) {
    return this
      .put(
        `${testConfig.baseUrl}/api/users/register-or-verify/${data.username}`,
        this.getClientAuth()
      )
      .then((result) => {
        data._id = result.body._id;

        return result.body;
      });
  },

  async createVerifiedUser(data) {
    await this.createUser(data);
    return this.verifyUser(data);
  },

  async verifyUser(data) {
    const password = 'password';
    const user = await User.findById(data._id);
    const { emailVerification: { token } } = user;
    const body = Object.assign(this.getClientAuth(), { password });

    await this.post(`${testConfig.baseUrl}/api/users/verify-email/${token}`, body);
    data.password = password;
    return data;
  },

  signInUser(data) {
    return this
      .post(
        `${testConfig.baseUrl}/oauth`,
        Object.assign(
          {
            grant_type: 'password',
          },
          _.pick(data, 'username', 'password'),
          this.getClientAuth(),
          data
        )
      )
      .then((result) => {
        data.auth = {
          access_token: result.body.access_token,
          refresh_token: result.body.refresh_token,
        };

        return result.body;
      });
  },

  signInSocial(sn, data, userData) {
    return this
      .post(
        `${testConfig.baseUrl}/api/users/snAuth/${sn}`,
        Object.assign({}, data, this.getClientAuth())
      )
      .then((result) => {
        userData.auth = {
          access_token: result.body.access_token,
          refresh_token: result.body.refresh_token,
        };
        return result.body;
      });
  },

  getUser(userData, data, userId) {
    data = data || userData;
    userId = userId || data._id;
    return this
      .get(
        `${testConfig.baseUrl}/api/users/${userId}`,
        { headers: { Authorization: `Bearer ${userData.auth.access_token}` } }
      )
      .then((result) => {
        data._id = result.body._id;
        return result.body;
      });
  },

  removeUser(data) {
    return Bb
      .try(() => {
        if (data._id) {
          return User.remove({ _id: data._id });
        }
      });
  },
};

const defineAuthResponse = () =>
  chakram.addProperty('authResponse', function checkAuthResponse(data) { // eslint-disable-line prefer-arrow-callback
    const validFields = ['access_token', 'refresh_token', 'expires_in', 'token_type'];
    const includesAllData = validFields.every(key =>
      Object.prototype.hasOwnProperty.call(data.body, key));
    const hasSuccessStatus = data.response.statusCode === 200;
    this.assert(
      includesAllData && hasSuccessStatus,
      `expected response to have statusCode 200 and contain ${validFields.join(', ')}`
    );
  });

before(() => Bb
  .join(
    defineAuthResponse(),
    User.remove({ username: { $ne: config.defaultUser.username } }),
    AccessToken.remove({}),
    RefreshToken.remove({})
  ));

module.exports = specHelper;
