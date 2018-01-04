/**
 * Created by vedi on 16/04/16.
 */

'use strict';

const _ = require('lodash');
const Bb = require('bluebird');
const fetch = require('node-fetch');

const FB_URL = 'https://graph.facebook.com';
const FIELDS = ['id', 'email'];

class FacebookHelper {

  constructor(options) {
    this.options = options || {};
  }

  getProfile(authData) {
    if (!authData.accessToken) {
      return Bb.reject(new Error('Missing required fields'));
    }

    const fieldsToFetch = this.options.fieldsToFetch || 'name';

    return fetch(
      `${FB_URL}/me?fields=id,${fieldsToFetch},email&access_token=${authData.accessToken}`)
      .then((res) => {
        if (res.status < 200 || res.status > 299) {
          return Bb.reject(new Error('wrong response from FB'));
        }
        return res.json();
      })
      .then((json) => {
        const hasMissedFields = _.find(FIELDS, fieldName => !json[fieldName]);
        return !hasMissedFields ? json : Bb.reject(new Error('Missing required fields from FB'));
      });
  }

  buildQuery(profile) {
    return { id: profile.id };
  }

  extract(profile) {
    return {
      username: profile.email,
      name: profile.name,
      firstName: profile.first_name,
      lastName: profile.last_name,
    };
  }
}

module.exports = FacebookHelper;
