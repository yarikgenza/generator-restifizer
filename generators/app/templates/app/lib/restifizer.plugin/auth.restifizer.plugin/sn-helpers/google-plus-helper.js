/**
 * Created by vedi on 16/04/16.
 */

'use strict';

const _ = require('lodash');
const Bb = require('bluebird');
const fetch = require('node-fetch');

const GOOGLE_URL = 'https://www.googleapis.com/oauth2/v3';
const FIELDS = ['sub', 'name', 'email'];

class GooglePlusHelper {

  constructor(options) {
    this.options = options || {};
  }

  getProfile(authData) {
    if (!authData.tokenId) {
      return Bb.reject(new Error('Missing required fields'));
    }

    return fetch(
      `${GOOGLE_URL}/tokeninfo?id_token=${authData.tokenId}`)
      .then((res) => {
        if (res.status < 200 || res.status > 299) {
          return Bb.reject(new Error('wrong response from Google'));
        }
        return res.json();
      })
      .then((json) => {
        if (!_.includes(this.options.audiences, json.aud)) {
          return Bb.reject(new Error('wrong credentials'));
        }

        if (1000 * json.exp < Date.now()) {
          return Bb.reject(new Error('token expired'));
        }

        if (!json.name) {
          json.name = authData.name;
        }

        const hasMissedFields = _.find(FIELDS, fieldName => !json[fieldName]);

        return !hasMissedFields ? json : Bb.reject(new Error('Missing required fields from Google'));
      });
  }

  buildQuery(profile) {
    return { id: profile.sub };
  }

  extract(profile) {
    return {
      username: profile.email,
      name: profile.name,
    };
  }
}

module.exports = GooglePlusHelper;
