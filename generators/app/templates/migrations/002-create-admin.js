'use strict';

const log = require('../config/log')(module);
const { config, modelProvider: { User } } = require('app/app');

exports.up = (next) => {
  log.info('Creating default admin account');

  User
    .findOne({ username: config.defaultUser.username })
    .then((user) => {
      if (!user) {
        return User.create(config.defaultUser);
      }
    })
    .asCallback(next);
};

exports.down = (next) => {
  log.info('Deleting default admin account');

  return User
    .remove({ username: config.defaultUser.username }, next);
};
