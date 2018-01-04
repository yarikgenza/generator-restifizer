/**
 * Created by vedi on 29/04/16.
 */

'use strict';

const eventBus = require('app/lib/event-bus');
const log = require('config/log')(module);

eventBus.ENTITY_EVENT_TYPES = {
  INSERT: 'insert',
  UPDATE: 'update',
  REMOVE: 'remove',
};

eventBus.ENTITY_EVENTS = {
  // It's filled dynamically in format '<model>.<action>', for example 'user.update'.
  // It will be put as a key and as a value
};

eventBus.ENTITY_EVENT_SPACE = 'models';

eventBus.init = (app) => {
  eventBus.EVENTS = app.consts.EVENTS;
  eventBus.register('app', eventBus.EVENTS);
  eventBus.setDefaultSpace('app');

  app.registerProvider('eventBus', eventBus);

  app.eventHandlers.forEach((eventHandler) => {
    eventHandler(eventBus);
  });
};

eventBus.onError((err) => {
  log.error('Error in event-bus');
  log.error(err);
});

module.exports = eventBus;
