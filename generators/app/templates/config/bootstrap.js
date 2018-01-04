/**
 * Created by vedi on 01/12/14.
 */

'use strict';

const version = require('package.json').version;

module.exports = async (app) => {
  const { expressApp, eventBus, agenda } = app;
  expressApp.agenda = agenda;
  eventBus.emitDeferred(eventBus.EVENTS.UPDATE_HEALTH, {
    key: 'version',
    status: true,
    value: version,
  });
};
