'use strict';

const Bb = require('bluebird');
const mongoose = require('mongoose');
const app = require('app/app');
const log = require('config/log')(module);

const { config } = app;

// mongoose.set('debug', true);
mongoose.Promise = Bb;

const healthOk = function healthOk() {
  const { eventBus } = app;
  eventBus.emit(eventBus.EVENTS.UPDATE_HEALTH, {
    key: 'mongodb',
    status: true,
    value: 'OK',
  });
};

const healthProblem = function healthProblem(err) {
  const { eventBus } = app;
  eventBus.emit(eventBus.EVENTS.UPDATE_HEALTH, {
    key: 'mongodb',
    status: false,
    value: JSON.stringify(err),
  });
};

mongoose.connect(config.mongo);
const db = mongoose.connection;

db.on('error', (err) => {
  healthProblem(err);
  log.error(err);
});
db.on('open', () => {
  healthOk();
});

const oldModelFn = mongoose.model;

mongoose.model = function model(...args) {
  const [, schema] = args;
  if (schema && schema.instanceOfSchema) {
    // code to patch every schema
  }

  return oldModelFn.apply(this, args);
};

mongoose.init = (app) => {
  const modelProvider = new Proxy({}, {
    get(target, name) {
      if (!(name in target)) {
        return mongoose.model(name);
      }
      return target[name];
    },
  });
  app.models.forEach((modelModule) => {
    modelModule(mongoose);
  });
  app.registerProvider('modelProvider', () => modelProvider);
};

module.exports = mongoose;
