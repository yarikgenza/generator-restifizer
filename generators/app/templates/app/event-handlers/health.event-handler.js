/**
 * Created by vedi on 05/06/16.
 */

'use strict';

const healthService = require('app/lib/services/health.service');

module.exports = (eventBus) => {
  eventBus.on(eventBus.EVENTS.UPDATE_HEALTH, (event) => {
    healthService.updateData(event.key, event.status, event.value);
  });
};
