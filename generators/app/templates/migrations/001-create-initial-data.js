'use strict';

const log = require('config/log')(module);
const { config, modelProvider: { Client } } = require('app/app');

exports.up = (next) => {
  log.info('Creating default client');

  Client
    .findOne({ clientId: config.defaultClient.clientId })
    .then((client) => {
      if (!client) {
        client = new Client(config.defaultClient);
        return client.save();
      }
    })
    .asCallback(next);
};

exports.down = (next) => {
  log.info('Removing default client');

  return Client.remove({ clientId: config.defaultClient.clientId }, next);
};
